/* ============================================================
   pedido.js · Malhú · envío del pedido y correo de confirmación
   ------------------------------------------------------------
   ESTE ES EL ÚNICO ARCHIVO QUE CAMBIA SI CAMBIA EL CANAL DE ENVÍO.
   confirmar-pedido.js arma el pedido y llama a:
     - enviarPedido(pedido)        → avisa a Malhú (hoy: WhatsApp, si MALHU.whatsapp está configurado)
     - enviarConfirmacion(pedido)  → correo al cliente (solo si MALHU.correo.activo)

   Estructura del pedido:
     { numero: "MH-20261018-1", fecha: ISO, estado,
       cliente: { nombre, comprobante: "celular" | "correo", celular, correo, notas },
       items: [ítems del carrito, ver carrito.js],
       totales: { subtotal, pendientes, total (o null), hayCatering },
       recojo: { puntoId, letra, nombre, direccion, fecha, hora, mapa } | null,
       evento: { lugar } | null,
       pago: { metodo, nombreMetodo, estado, operacion? } }

   Para otro canal (servidor propio, formulario, etc.) reemplaza el cuerpo de
   enviarPedido; debe devolver { canal, ok }.
   Necesita app.js (MALHU, enlaceWhatsApp, formatoSoles).
   ============================================================ */

const precioTexto = (v) => (typeof v === "number" && isFinite(v) ? formatoSoles(v) : "por confirmar");
function fechaLarga(iso) {
  try { return new Date(iso + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
  catch (e) { return iso; }
}
function horaCorta(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

/** Líneas comunes del pedido (ítems, totales, recojo, evento y pago). */
function lineasPedido(pedido) {
  const l = [];
  pedido.items.forEach((x, k) => {
    const sub = typeof x.precioUnitario === "number" ? x.precioUnitario * x.cantidad : null;
    if (x.tipo === "catering") {
      const c = x.catering;
      l.push(`${k + 1}. Catering · ${c.evento} · ${c.personas} personas`);
      l.push(`   Fecha: ${c.fecha ? fechaLarga(c.fecha) : "por definir"}`);
      l.push(`   Costo estimado: ${precioTexto(sub)}`);
    } else {
      l.push(`${k + 1}. ${x.nombre} × ${x.cantidad} · ${precioTexto(sub)}`);
      if (x.tipo === "personalizado" && x.ingredientes.length) {
        l.push(`   Ingredientes: ${x.ingredientes.map((i) => i.nombre + (i.cantidad > 1 ? ` ×${i.cantidad}` : "")).join(", ")}`);
      }
    }
  });
  const t = pedido.totales;
  l.push("");
  if (t.pendientes) l.push(`${t.pendientes === 1 ? "1 ítem" : `${t.pendientes} ítems`} con precio por confirmar.`);
  l.push(`Total${t.hayCatering ? " estimado" : ""}: ${precioTexto(t.total)}`);
  if (pedido.recojo) {
    const r = pedido.recojo;
    l.push("");
    l.push(`Recojo: ${r.letra}. ${r.nombre}${r.direccion ? ` (${r.direccion})` : ""}`);
    l.push(`Día y hora: ${fechaLarga(r.fecha)}, ${horaCorta(r.hora)}`);
    if (r.mapa) l.push(`Mapa: ${r.mapa}`);
  }
  if (pedido.evento && pedido.evento.lugar) {
    l.push("");
    l.push(`Lugar del evento: ${pedido.evento.lugar}`);
  }
  if (pedido.pago) {
    l.push("");
    l.push(`Pago: ${pedido.pago.nombreMetodo} · ${pedido.pago.estado}`);
    if (pedido.pago.operacion) l.push(`N.° de operación: ${pedido.pago.operacion}`);
  }
  return l;
}

/** Texto del aviso a Malhú (WhatsApp u otro canal de texto). */
function mensajePedido(pedido) {
  const l = [`Hola Malhú, quiero confirmar mi pedido ${pedido.numero}:`, ""];
  l.push(...lineasPedido(pedido));
  l.push("");
  l.push(`Nombre: ${pedido.cliente.nombre}`);
  if (pedido.cliente.celular) l.push(`Celular (enviar comprobante): ${pedido.cliente.celular}`);
  if (pedido.cliente.correo) l.push(`Correo: ${pedido.cliente.correo}`);
  if (pedido.cliente.notas) l.push(`Notas: ${pedido.cliente.notas}`);
  if (pedido.pago && pedido.pago.celularPago) l.push(`Celular que pagó: ${pedido.pago.celularPago}`);
  return l.join("\n");
}

/** Comprobante para el cliente (va al número con el que pagó). */
function mensajeComprobante(pedido) {
  const l = [`Comprobante de tu pedido ${pedido.numero} · Malhú`, ""];
  l.push(...lineasPedido(pedido));
  l.push("");
  l.push(`Nombre: ${pedido.cliente.nombre}`);
  l.push("Tu pago queda pendiente hasta que Malhú lo verifique.");
  return l.join("\n");
}

/**
 * Envía el comprobante al celular que hizo el pago (temporal: abre WhatsApp hacia ese número;
 * la persona toca "Enviar"). Un envío automático a 2 números necesita un servidor.
 */
function enviarComprobanteCliente(pedido) {
  const n = String((pedido.pago && pedido.pago.celularPago) || pedido.cliente.celular || "").replace(/\D/g, "");
  if (!/^9\d{8}$/.test(n)) return { ok: false, motivo: "sin-numero" };
  window.open(`https://wa.me/51${n}?text=${encodeURIComponent(mensajeComprobante(pedido))}`, "_blank", "noopener");
  return { ok: true, numero: n };
}

/** ¿Hay un número real de WhatsApp? (el de ejemplo 51999999999 no cuenta) */
function whatsappConfigurado() {
  const n = String((typeof MALHU !== "undefined" && MALHU.whatsapp) || "").replace(/\D/g, "");
  return n.length >= 11 && n !== "51999999999";
}

/** Avisa a Malhú por el canal actual. Temporal: WhatsApp. Sin canal configurado no hace nada. */
function enviarPedido(pedido) {
  if (!whatsappConfigurado()) return { canal: null, ok: false, motivo: "sin-canal" };
  window.open(enlaceWhatsApp(mensajePedido(pedido)), "_blank", "noopener");
  return { canal: "whatsapp", ok: true };
}

/** Contenido del correo de confirmación para el cliente. */
function contenidoConfirmacion(pedido) {
  return {
    para: pedido.cliente.correo,
    asunto: `Tu pedido ${pedido.numero} · Malhú`,
    texto: [`Hola ${pedido.cliente.nombre}, este es tu pedido ${pedido.numero}:`, "", ...lineasPedido(pedido)].join("\n"),
  };
}

/**
 * Correo de confirmación al cliente.
 * El navegador NO puede enviar correos por sí solo ni guardar claves de API:
 * se necesita un servidor o servicio (MALHU.correo.endpoint) que reciba esto y lo envíe.
 * Mientras MALHU.correo.activo sea false, no envía nada y lo dice.
 * @returns {Promise<{enviado: boolean, motivo?: string}>}
 */
function enviarConfirmacion(pedido) {
  const c = (typeof MALHU !== "undefined" && MALHU.correo) || {};
  if (!c.activo || !c.endpoint) return Promise.resolve({ enviado: false, motivo: "inactivo" });
  return fetch(c.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contenidoConfirmacion(pedido)),
  })
    .then((r) => ({ enviado: r.ok, motivo: r.ok ? undefined : "error-servidor" }))
    .catch(() => ({ enviado: false, motivo: "sin-conexion" }));
}
