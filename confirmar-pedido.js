/* ============================================================
   confirmar-pedido.js · Malhú · pantalla "Confirmación de datos"
   Flujo: datos + método de pago + recojo (platos) / lugar del evento (catering)
   → "Pedir" valida → ventana de pago → pedido guardado → pantalla final
   → recién entonces se vacía el carrito.
   Necesita app.js, carrito.js, pedido.js, detalle-pedido.js, puntos-recojo.js,
   mapa-recojo.js y pago.js.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s) => document.querySelector(s);
  const esNumero = (v) => typeof v === "number" && isFinite(v);
  const BORRADOR = "malhu-borrador-pedido";
  const ICONOS = {
    yapePlin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
    tarjeta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/></svg>',
    efectivo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
  };

  /* ---------- Carrito vacío → al carrito ---------- */
  let terminado = false;
  if (!Carrito.leer().length) { location.replace("plato-menu.html#carrito"); return; }

  /* ---------- Borrador (sobrevive a recargar la página) ---------- */
  let borrador = {};
  try { borrador = JSON.parse(sessionStorage.getItem(BORRADOR)) || {}; } catch (e) {}
  const guardarBorrador = () => { try { sessionStorage.setItem(BORRADOR, JSON.stringify(borrador)); } catch (e) {} };
  let recojo = Object.assign({ puntoId: "", fecha: MapaRecojo.hoyISO(), hora: "" }, borrador.recojo || {});
  if (recojo.fecha < MapaRecojo.hoyISO()) { recojo.fecha = MapaRecojo.hoyISO(); recojo.hora = ""; }

  const nombre = $("#nombre"), correo = $("#correo"), celular = $("#celular"), notas = $("#notas"), lugar = $("#lugar");
  nombre.value = borrador.nombre || "";
  correo.value = borrador.correo || "";
  celular.value = borrador.celular || "";
  notas.value = borrador.notas || "";
  lugar.value = borrador.lugar || "";
  [[nombre, "nombre"], [correo, "correo"], [celular, "celular"], [notas, "notas"], [lugar, "lugar"]].forEach(([c, k]) =>
    c.addEventListener("input", () => { borrador[k] = c.value; guardarBorrador(); }));

  /* ---------- Comprobante: por celular o por correo (se pide solo el elegido) ---------- */
  const medios = [...document.querySelectorAll('input[name="medio"]')];
  const medioElegido = () => (medios.find((r) => r.checked) || medios[0]).value;
  if (borrador.medio) medios.forEach((r) => (r.checked = r.value === borrador.medio));
  function aplicarMedio() {
    const m = medioElegido();
    $("#grupo-celular").hidden = m !== "celular";
    $("#grupo-correo").hidden = m !== "correo";
    celular.required = m === "celular";
    correo.required = m === "correo";
  }
  medios.forEach((r) => r.addEventListener("change", () => {
    borrador.medio = r.value;
    guardarBorrador();
    aplicarMedio();
    limpiarError(r.value === "celular" ? "correo" : "celular");
  }));
  aplicarMedio();

  // Nota del correo: solo si el envío está activo (no se promete un correo que no saldrá)
  $("#nota-correo").hidden = !(MALHU.correo && MALHU.correo.activo && MALHU.correo.endpoint);

  /* ---------- Métodos de pago (radios reales) ---------- */
  const contMetodos = $("#metodos");
  Pago.metodos().forEach((m) => {
    const etq = document.createElement("label");
    etq.className = "opcion-pago" + (m.disponible ? "" : " deshabilitada");
    etq.innerHTML = `
      <input type="radio" name="metodo" value="${m.id}" ${m.disponible ? "" : "disabled"} aria-describedby="pago-${m.id}-detalle">
      <span class="pago-ico">${ICONOS[m.id] || ""}</span>
      <span><span class="pago-nombre"></span><span class="pago-detalle" id="pago-${m.id}-detalle"></span></span>`;
    etq.querySelector(".pago-nombre").textContent = m.nombre;
    etq.querySelector(".pago-detalle").textContent = m.detalle;
    const radio = etq.querySelector("input");
    if (m.disponible && borrador.metodo === m.id) radio.checked = true;
    radio.addEventListener("change", () => { borrador.metodo = m.id; guardarBorrador(); limpiarError("pago"); });
    contMetodos.append(etq);
  });
  const metodoElegido = () => { const r = document.querySelector('input[name="metodo"]:checked'); return r ? r.value : ""; };

  /* ---------- Qué bloques aplican (platos → recojo; catering → lugar del evento) ---------- */
  let resumen = Carrito.resumen();
  function aplicarBloques() {
    resumen = Carrito.resumen();
    document.querySelectorAll("[data-solo-platos]").forEach((b) => (b.hidden = !resumen.hayPlatos));
    document.querySelectorAll("[data-solo-catering]").forEach((b) => (b.hidden = !resumen.hayCatering));
    lugar.required = resumen.hayCatering;
    lugar.setAttribute("aria-required", String(resumen.hayCatering));
    // Resumen compacto + botón "Pedir"
    $("#res-items").textContent = resumen.unidades === 1 ? "1 ítem" : `${resumen.unidades} ítems`;
    $("#res-etq").textContent = resumen.hayCatering ? "Total estimado" : "Total";
    const tot = $("#res-total");
    tot.textContent = resumen.total === null ? "Por confirmar" : `${formatoSoles(resumen.total)}${resumen.hayCatering ? " (estimado)" : ""}`;
    tot.classList.toggle("sin-precio", resumen.total === null);
    const notasRes = [];
    if (resumen.pendientes) notasRes.push(`${resumen.pendientes === 1 ? "1 ítem" : `${resumen.pendientes} ítems`} con precio por confirmar.`);
    if (resumen.hayCatering) notasRes.push("El costo del catering es estimado. Malhú confirma el precio final.");
    $("#res-nota").textContent = notasRes.join(" ");
    $("#res-nota").hidden = !notasRes.length;
    $("#pedir").textContent = resumen.total === null ? "Pedir" : `Pedir · ${formatoSoles(resumen.total)}`;
  }
  aplicarBloques();
  Carrito.alCambiar(() => {
    if (terminado) return;
    if (!Carrito.leer().length) { location.replace("plato-menu.html#carrito"); return; }
    aplicarBloques();
  });

  /* ---------- Recojo: tarjeta "Tu pedido estará listo" + miniatura ---------- */
  const lienzo = $("#mini-lienzo");
  function pintarRecojo() {
    const p = MapaRecojo.porId(recojo.puntoId);
    const texto = $("#listo-texto");
    const extra = $("#listo-extra");
    if (p && recojo.hora) {
      texto.textContent = `${MapaRecojo.horaLegible(recojo.hora)} en ${p.nombre}`;
      texto.classList.remove("vacio");
      extra.textContent = `${MapaRecojo.fechaLegible(recojo.fecha)} · ${p.letra}. ${p.direccion}${p.referencia ? " · " + p.referencia : ""}`;
      extra.hidden = false;
    } else if (p) {
      texto.textContent = `Elige a qué hora recoges en ${p.nombre}`;
      texto.classList.add("vacio");
      extra.hidden = true;
    } else {
      texto.textContent = "Elige dónde y a qué hora recoges";
      texto.classList.add("vacio");
      extra.hidden = true;
    }
    $("#elegir-punto").textContent = p ? "Cambiar punto u hora de recojo" : "Elegir punto de recojo";
    $("#mini-mapa").setAttribute("aria-label", p ? `Abrir el mapa. Punto elegido: ${p.letra}, ${p.nombre}` : "Abrir el mapa de puntos de recojo");
    $("#mini-etq").textContent = p ? `${p.letra}. ${p.nombre}` : "Ver mapa";
    if (!$(".b-mapa").hidden) MapaRecojo.miniatura(lienzo, recojo);
  }
  pintarRecojo();
  let tRedimension;
  addEventListener("resize", () => { clearTimeout(tRedimension); tRedimension = setTimeout(() => { if (!$(".b-mapa").hidden) MapaRecojo.miniatura(lienzo, recojo); }, 200); });

  const abrirMapa = (e) => MapaRecojo.abrir({
    seleccion: recojo,
    origen: e.currentTarget,
    alListo: (sel) => {
      recojo = sel;
      borrador.recojo = recojo;
      guardarBorrador();
      pintarRecojo();
      if (recojo.puntoId && recojo.hora) limpiarError("recojo");
    },
  });
  $("#mini-mapa").addEventListener("click", abrirMapa);
  $("#elegir-punto").addEventListener("click", abrirMapa);

  /* ---------- Validación ---------- */
  const CAMPOS = {
    nombre: { el: nombre, err: "#err-nombre", etiqueta: "Nombre" },
    celular: { el: celular, err: "#err-celular", etiqueta: "Celular" },
    correo: { el: correo, err: "#err-correo", etiqueta: "Correo" },
    pago: { el: $("#pagos"), err: "#err-pago", etiqueta: "Método de pago", foco: () => document.querySelector('input[name="metodo"]:not(:disabled)') },
    recojo: { el: $("#elegir-punto"), err: "#err-recojo", etiqueta: "Punto y hora de recojo" },
    lugar: { el: lugar, err: "#err-lugar", etiqueta: "Lugar del evento" },
  };
  const correoValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const soloDigitos = (v) => String(v).replace(/\D/g, "").replace(/^51(?=9\d{8}$)/, "");
  const celularValido = (v) => /^9\d{8}$/.test(soloDigitos(v));
  function errorDe(k) {
    switch (k) {
      case "nombre": return nombre.value.trim() ? "" : "Escribe tu nombre.";
      case "celular":
        if (medioElegido() !== "celular") return "";
        if (!celular.value.trim()) return "Escribe tu número de celular.";
        return celularValido(celular.value) ? "" : "Revisa tu celular: son 9 dígitos y empieza con 9.";
      case "correo":
        if (medioElegido() !== "correo") return "";
        if (!correo.value.trim()) return "Escribe tu correo.";
        return correoValido(correo.value.trim()) ? "" : "Revisa tu correo: debe tener la forma nombre@dominio.com.";
      case "pago":
        if (!Pago.metodos().some((m) => m.disponible)) return "Por ahora no hay métodos de pago disponibles.";
        return metodoElegido() ? "" : "Elige un método de pago.";
      case "recojo":
        if (!resumen.hayPlatos) return "";
        if (!recojo.puntoId) return "Elige un punto y una hora de recojo.";
        return recojo.hora ? "" : "Elige a qué hora recoges.";
      case "lugar":
        if (!resumen.hayCatering) return "";
        return lugar.value.trim() ? "" : "Escribe el lugar del evento (dirección o referencia).";
    }
    return "";
  }
  function mostrarError(k, msg) {
    const c = CAMPOS[k];
    const p = $(c.err);
    p.textContent = msg;
    p.hidden = !msg;
    if (k !== "recojo") c.el.setAttribute("aria-invalid", String(!!msg)); // un botón no admite aria-invalid
  }
  const limpiarError = (k) => mostrarError(k, "");
  // Al salir del campo se valida; mientras se corrige, el error se actualiza
  [["nombre", nombre], ["celular", celular], ["correo", correo], ["lugar", lugar]].forEach(([k, c]) => {
    c.addEventListener("blur", () => { if (c.value.trim() || c.dataset.tocado) mostrarError(k, errorDe(k)); c.dataset.tocado = "1"; });
    c.addEventListener("input", () => { if (!$(CAMPOS[k].err).hidden) mostrarError(k, errorDe(k)); });
  });

  /* ---------- Pedir ---------- */
  const form = $("#form-pedido");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!Carrito.leer().length) { location.replace("plato-menu.html#carrito"); return; }
    aplicarBloques();
    const fallas = [];
    ["nombre", "celular", "correo", "pago", "recojo", "lugar"].forEach((k) => {
      const msg = errorDe(k);
      mostrarError(k, msg);
      if (msg) fallas.push(k);
    });
    if (fallas.length) {
      const primero = CAMPOS[fallas[0]];
      (primero.foco ? primero.foco() : primero.el).focus();
      const nombres = fallas.map((k) => CAMPOS[k].etiqueta);
      const anuncio = $("#anuncio-errores");
      anuncio.textContent = "";
      setTimeout(() => {
        anuncio.textContent = `Revisa ${nombres.length === 1 ? "este campo" : "estos campos"}: ${nombres.length === 1 ? nombres[0] : nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1]}. ${$(primero.err).textContent}`;
      }, 60);
      return;
    }
    const pedido = armarPedido();
    Pago.abrir({ metodo: metodoElegido(), pedido, origen: $("#pedir"), alCompletar: (pago) => finalizar(pedido, pago) });
  });

  function numeroPedido() {
    const d = new Date();
    const hoy = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    let n = 1;
    try {
      const c = JSON.parse(localStorage.getItem("malhu-contador-pedidos")) || {};
      n = c.fecha === hoy ? (c.n || 0) + 1 : 1;
    } catch (e) {}
    return { numero: `MH-${hoy}-${n}`, hoy, n };
  }

  function armarPedido() {
    const items = Carrito.leer();
    const r = Carrito.resumen(items);
    const p = MapaRecojo.porId(recojo.puntoId);
    return {
      numero: numeroPedido().numero,
      fecha: new Date().toISOString(),
      estado: "",
      cliente: {
        nombre: nombre.value.trim(),
        comprobante: medioElegido(), // "celular" | "correo"
        celular: medioElegido() === "celular" ? soloDigitos(celular.value) : "",
        correo: medioElegido() === "correo" ? correo.value.trim() : "",
        notas: notas.value.trim(),
      },
      items,
      totales: { subtotal: r.subtotal, pendientes: r.pendientes, total: r.total, hayCatering: r.hayCatering },
      recojo: r.hayPlatos && p ? {
        puntoId: p.id, letra: p.letra, nombre: p.nombre, direccion: p.direccion, referencia: p.referencia,
        fecha: recojo.fecha, hora: recojo.hora, mapa: MapaRecojo.enlaceMapa(p),
      } : null,
      evento: r.hayCatering ? { lugar: lugar.value.trim() } : null,
      pago: null,
    };
  }

  /* ---------- Al completar el pago ---------- */
  function finalizar(pedido, pago) {
    const num = numeroPedido(); // el número se reserva recién aquí
    pedido.numero = num.numero;
    try { localStorage.setItem("malhu-contador-pedidos", JSON.stringify({ fecha: num.hoy, n: num.n })); } catch (e) {}
    pedido.pago = pago;
    pedido.estado = pago.estado;
    try { localStorage.setItem("malhu-ultimo-pedido", JSON.stringify(pedido)); } catch (e) {}
    if (borrador.agregarPlan && pedido.items.some((x) => x.tipo !== "catering")) DetallePedido.agregarAlPlan(pedido.items);

    // Aviso a Malhú (canal temporal: WhatsApp, solo si está configurado). Va dentro del clic.
    const envio = enviarPedido(pedido);
    // Registro en Firestore ("Pedidos"); si falla, el pedido sigue en localStorage y por WhatsApp
    if (window.MalhuDB) {
      MalhuDB.guardarPedido(pedido)
        .then((id) => console.info(`Pedido ${pedido.numero} guardado en Firestore (${id}).`))
        .catch((er) => console.error("No se pudo guardar el pedido en Firestore:", er));
    }
    terminado = true;
    mostrarFinal(pedido, envio);
    // Correo: solo si hay servicio; la pantalla dice la verdad según el resultado
    const textoCorreo = $("#f-correo-texto");
    textoCorreo.textContent = "Guarda tu número de pedido.";
    if (pedido.cliente.correo) enviarConfirmacion(pedido).then((r) => {
      if (r.enviado) textoCorreo.textContent = `Te enviamos la confirmación a ${pedido.cliente.correo}. Igual guarda tu número de pedido.`;
    });
    try { sessionStorage.removeItem(BORRADOR); } catch (e) {}
    // Recién con la pantalla final visible se vacía el carrito
    setTimeout(() => Carrito.vaciar(), 0);
  }

  function mostrarFinal(pedido, envio) {
    form.hidden = true;
    $("#subtitulo").hidden = true;
    $("#titulo").textContent = "Tu pedido";
    document.title = `Pedido ${pedido.numero} · Malhú Coffee break & Catering`;
    const final = $("#final");
    $("#f-numero").textContent = pedido.numero;
    $("#f-estado").textContent = `Pago: ${pedido.pago.estado}`;
    const textosPago = {
      yapePlin: "Falta que Malhú verifique tu Yape o Plin. Tu pedido queda pendiente hasta entonces.",
      efectivo: "Pagas en efectivo cuando recojas tu pedido.",
      tarjeta: "Tu pago con tarjeta fue aprobado por el proveedor.",
    };
    $("#f-pago-texto").textContent = textosPago[pedido.pago.metodo] || "";
    $("#f-envio-texto").textContent = envio && envio.ok
      ? "Se abrió WhatsApp con tu pedido. Envía el mensaje para que Malhú lo reciba."
      : "Comparte tu número de pedido con Malhú para que lo ubique.";
    $("#reenviar").hidden = !(envio && envio.ok);

    // Comprobante al número que hizo el pago (2.º mensaje: un botón, porque el navegador bloquea abrir dos WhatsApp a la vez)
    const numCliente = (pedido.pago.celularPago || pedido.cliente.celular || "").replace(/\D/g, "");
    const cajaWa = $("#f-whatsapp");
    cajaWa.hidden = !/^9\d{8}$/.test(numCliente);
    if (!cajaWa.hidden) {
      const legible = numCliente.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
      $("#f-whatsapp-texto").textContent = envio && envio.ok
        ? `1) El pedido ya se abrió en WhatsApp hacia Malhú. 2) Ahora envíate el comprobante al ${legible}.`
        : `Envíate el comprobante a tu WhatsApp (${legible}).`;
      const btn = $("#enviar-comprobante");
      btn.textContent = `Enviar comprobante a mi WhatsApp (${legible})`;
      btn.onclick = () => {
        const r = enviarComprobanteCliente(pedido);
        $("#f-estado-copia").textContent = r.ok ? `Se abrió WhatsApp hacia el ${legible}. Toca Enviar para guardar tu comprobante.` : "No se encontró un celular válido.";
      };
    }

    const dl = $("#f-datos");
    dl.replaceChildren();
    const fila = (k, v, enlace) => {
      const d = document.createElement("div");
      const dt = document.createElement("dt");
      dt.textContent = k;
      const dd = document.createElement("dd");
      dd.textContent = v;
      if (enlace) {
        dd.append(document.createElement("br"));
        const a = document.createElement("a");
        a.href = enlace;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "Ver el punto en el mapa";
        dd.append(a);
      }
      d.append(dt, dd);
      dl.append(d);
    };
    fila("Nombre", pedido.cliente.nombre);
    if (pedido.cliente.celular) fila("Celular", pedido.cliente.celular.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3"));
    if (pedido.cliente.correo) fila("Correo", pedido.cliente.correo);
    if (pedido.recojo) {
      const r = pedido.recojo;
      fila("Recojo", `${MapaRecojo.horaLegible(r.hora)} en ${r.nombre} · ${MapaRecojo.fechaLegible(r.fecha)}${r.direccion ? " · " + r.direccion : ""}`, r.mapa);
    }
    if (pedido.evento) fila("Lugar del evento", pedido.evento.lugar + " · Malhú coordina contigo la entrega del catering.");
    fila("Pago", `${pedido.pago.nombreMetodo} · ${pedido.pago.estado}${pedido.pago.operacion ? " · Operación " + pedido.pago.operacion : ""}${pedido.pago.celularPago ? " · Pagó desde " + pedido.pago.celularPago.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") : ""}`);
    if (pedido.cliente.notas) fila("Notas", pedido.cliente.notas);

    $("#f-items").replaceChildren(...pedido.items.map((x) => {
      const li = document.createElement("li");
      const a = document.createElement("span");
      a.textContent = x.tipo === "catering" ? x.nombre : `${x.nombre} × ${x.cantidad}`;
      const b = document.createElement("span");
      b.className = "dato";
      b.textContent = Carrito.textoPrecio(Carrito.subtotalDe(x));
      li.append(a, b);
      return li;
    }));
    $("#f-total-etq").textContent = pedido.totales.hayCatering ? "Total estimado" : "Total";
    $("#f-total").textContent = Carrito.textoPrecio(pedido.totales.total);

    final.hidden = false;
    window.scrollTo(0, 0);
    $("#titulo").focus();

    $("#copiar-numero").onclick = async () => {
      const estado = $("#f-estado-copia");
      try { await navigator.clipboard.writeText(pedido.numero); estado.textContent = `Número ${pedido.numero} copiado.`; }
      catch (e) { estado.textContent = `No se pudo copiar. Tu número es ${pedido.numero}.`; }
      $("#copiar-numero").textContent = "Copiado";
      setTimeout(() => ($("#copiar-numero").textContent = "Copiar número de pedido"), 1800);
    };
    $("#reenviar").onclick = () => enviarPedido(pedido);
  }
});
