/* ============================================================
   pago.js · Malhú · métodos de pago
   - Pago.metodos(): qué métodos hay y si están disponibles (según MALHU).
   - Pago.abrir({ metodo, pedido, origen, alCompletar }): ventana del método.
       Yape o Plin → pasos + número + QR (si están configurados) + "Ya realicé el pago".
       El pedido queda "Pendiente de verificación": Malhú revisa el pago a mano.
       NADA aquí afirma que un pago fue verificado.
   - pagarConTarjeta(pedido): integración con el proveedor (Culqi Checkout).
       Los datos de la tarjeta los escribe la persona en la ventana del proveedor:
       NUNCA pasan por este código ni se guardan. Requiere un servidor para cobrar.
   Necesita app.js (MALHU, formatoSoles).
   ============================================================ */

const Pago = (function () {
  const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quieto = () => reducir || document.documentElement.classList.contains("quieto");
  const esNumero = (v) => typeof v === "number" && isFinite(v);
  const cfg = () => (typeof MALHU !== "undefined" && MALHU.pagos) || {};
  const numeroLegible = (n) => String(n).replace(/\D/g, "").replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");

  /** Lista de métodos con su disponibilidad. Sin datos configurados → deshabilitado (no se inventa nada). */
  function metodos() {
    const yp = cfg().yapePlin || {};
    const ef = cfg().efectivo || {};
    return [
      {
        id: "yapePlin",
        nombre: "Yape o Plin",
        disponible: !!(yp.activo && /\d{9}/.test(String(yp.numero || ""))),
        detalle: yp.activo && yp.numero ? `Al ${numeroLegible(yp.numero)}. Malhú verifica tu pago.` : "No disponible por ahora",
      },
      {
        id: "tarjeta",
        nombre: "Tarjeta",
        disponible: typeof MALHU !== "undefined" && MALHU.tarjetaActiva === true && !!(MALHU.tarjeta && MALHU.tarjeta.llavePublica),
        detalle: typeof MALHU !== "undefined" && MALHU.tarjetaActiva ? "Débito o crédito, en la ventana segura del proveedor." : "Próximamente",
      },
      {
        id: "efectivo",
        nombre: "Efectivo al recoger",
        disponible: !!ef.activo,
        detalle: ef.activo ? "Pagas cuando recoges tu pedido." : "No disponible por ahora",
      },
    ];
  }

  /* ---------- Ventana de Yape o Plin ---------- */
  let dialogo, origen = null, alCompletar = null, pedidoActual = null;
  function montar() {
    dialogo = document.createElement("dialog");
    dialogo.className = "pago-dlg";
    dialogo.inert = true;
    dialogo.setAttribute("role", "dialog");
    dialogo.setAttribute("aria-modal", "true");
    dialogo.setAttribute("aria-labelledby", "pago-titulo");
    dialogo.innerHTML = `
      <div class="pago-cabeza">
        <h2 id="pago-titulo" tabindex="-1">Paga con Yape o Plin</h2>
        <button class="btn btn-redondo" type="button" data-pago-cerrar aria-label="Cerrar sin pagar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div class="pago-cuerpo">
        <p class="pago-monto-etq">Monto a pagar</p>
        <p class="pago-monto" data-pago-monto></p>
        <p class="pago-nota" data-pago-nota-monto hidden></p>
        <div class="pago-qrs" data-pago-qrs hidden></div>
        <ol class="pago-pasos" data-pago-pasos></ol>
        <div class="pago-numero">
          <div>
            <p class="pago-numero-etq">Número</p>
            <p class="pago-numero-valor dato" data-pago-numero></p>
            <p class="pago-titular" data-pago-titular hidden></p>
          </div>
          <button class="btn btn-fantasma pago-copiar" type="button" data-pago-copiar>Copiar número</button>
        </div>
        <p class="sr" role="status" data-pago-estado></p>
        <div class="pago-campo" data-pago-campos-codigo>
          <label class="campo-etq" for="pago-operacion">Número de operación <span class="opcional">(obligatorio)</span></label>
          <input class="campo" id="pago-operacion" type="text" inputmode="numeric" autocomplete="off" maxlength="16" required aria-required="true" aria-invalid="false" aria-describedby="pago-operacion-error pago-operacion-ayuda">
          <p class="pago-error" id="pago-operacion-error" hidden></p>
          <p class="pago-nota" id="pago-operacion-ayuda">Es el código de verificación que sale en el comprobante de Yape o Plin (solo números). Sin él no se completa el pedido.</p>
        </div>
        <div class="pago-campo" data-pago-campos-codigo>
          <label class="campo-etq" for="pago-celular">Celular con el que pagaste <span class="opcional">(obligatorio)</span></label>
          <input class="campo" id="pago-celular" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="11" placeholder="9XX XXX XXX" required aria-required="true" aria-invalid="false" aria-describedby="pago-celular-error pago-celular-ayuda">
          <p class="pago-error" id="pago-celular-error" hidden></p>
          <p class="pago-nota" id="pago-celular-ayuda">A este número podrás enviarte el comprobante del pedido por WhatsApp.</p>
        </div>
        <p class="sr" aria-live="assertive" data-pago-anuncio></p>
        <p class="pago-aviso">Tu pedido quedará <strong>pendiente de verificación</strong> hasta que Malhú confirme que recibió el pago.</p>
        <div class="pago-botones">
          <button class="btn btn-primario" type="button" data-pago-listo>Ya realicé el pago</button>
          <button class="btn btn-fantasma" type="button" data-pago-cerrar>Volver</button>
        </div>
      </div>`;
    document.body.append(dialogo);
    const $ = (s) => dialogo.querySelector(s);

    $("[data-pago-copiar]").addEventListener("click", async () => {
      const n = String((cfg().yapePlin || {}).numero || "");
      const estado = $("[data-pago-estado]");
      try { await navigator.clipboard.writeText(n); estado.textContent = "Número copiado."; }
      catch (e) { estado.textContent = `No se pudo copiar. El número es ${numeroLegible(n)}.`; }
      $("[data-pago-copiar]").textContent = "Copiado";
      setTimeout(() => ($("[data-pago-copiar]").textContent = "Copiar número"), 1800);
    });
    /* Código de verificación (n.° de operación) y celular del pago: obligatorios y con formato válido.
       La web no puede consultar a Yape/Plin si el número existe: eso lo verifica Malhú en su app. */
    const soloDigitos = (v) => String(v).replace(/\D/g, "");
    const errorCampo = (id) => {
      const v = $(id).value.trim();
      if (id === "#pago-operacion") {
        if (!v) return "Escribe el número de operación de tu Yape o Plin.";
        if (/[^\d\s-]/.test(v)) return "El número de operación solo lleva números.";
        const d = soloDigitos(v);
        return d.length >= 6 && d.length <= 12 ? "" : "Revisa el número de operación: debe tener entre 6 y 12 dígitos, tal como sale en tu comprobante.";
      }
      if (!v) return "Escribe el celular con el que pagaste.";
      return /^9\d{8}$/.test(soloDigitos(v)) ? "" : "Revisa el celular: son 9 dígitos y empieza con 9.";
    };
    const mostrarErrorCampo = (id, msg) => {
      const p = $(id + "-error");
      p.textContent = msg;
      p.hidden = !msg;
      $(id).setAttribute("aria-invalid", String(!!msg));
    };
    ["#pago-operacion", "#pago-celular"].forEach((id) => {
      $(id).addEventListener("blur", () => { if ($(id).value.trim()) mostrarErrorCampo(id, errorCampo(id)); });
      $(id).addEventListener("input", () => { if (!$(id + "-error").hidden) mostrarErrorCampo(id, errorCampo(id)); });
    });

    $("[data-pago-listo]").addEventListener("click", () => {
      const pideCodigo = !$("[data-pago-campos-codigo]").hidden;
      if (pideCodigo) {
        const fallas = ["#pago-operacion", "#pago-celular"].filter((id) => {
          const msg = errorCampo(id);
          mostrarErrorCampo(id, msg);
          return !!msg;
        });
        if (fallas.length) {
          $(fallas[0]).focus();
          const a = $("[data-pago-anuncio]");
          a.textContent = "";
          setTimeout(() => (a.textContent = $(fallas[0] + "-error").textContent), 60);
          return; // sin código válido no se completa el pedido
        }
      }
      const resultado = {
        metodo: "yapePlin",
        nombreMetodo: "Yape o Plin",
        estado: pideCodigo ? "Pendiente de verificación" : "Pendiente de pago (monto por confirmar)",
        operacion: pideCodigo ? soloDigitos($("#pago-operacion").value) : "",
        celularPago: pideCodigo ? soloDigitos($("#pago-celular").value) : "",
      };
      const f = alCompletar;
      alCompletar = null; // ya completado: cerrar no cancela
      origen = null;
      dialogo.close();
      if (f) f(resultado);
    });
    dialogo.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(); });
    dialogo.addEventListener("click", (e) => { if (e.target === dialogo || e.target.closest("[data-pago-cerrar]")) cerrar(); });
    dialogo.addEventListener("close", () => {
      dialogo.inert = true;
      if (typeof Carrito !== "undefined") Carrito.bloquearFondo();
      if (origen && origen.isConnected) origen.focus();
    });
  }
  function cerrar() {
    if (!dialogo.open) return;
    if (quieto()) { dialogo.close(); return; }
    const a = dialogo.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.98)" }], { duration: 180, easing: EASE });
    a.onfinish = () => dialogo.close();
  }

  function abrirYapePlin(pedido) {
    if (!dialogo) montar();
    const $ = (s) => dialogo.querySelector(s);
    const yp = cfg().yapePlin || {};
    const total = pedido.totales.total;
    const pendientes = pedido.totales.pendientes;
    const conMonto = esNumero(total);
    $("[data-pago-monto]").textContent = conMonto ? formatoSoles(total) : "Por confirmar";
    $("[data-pago-monto]").classList.toggle("sin-precio", !conMonto);
    const nota = $("[data-pago-nota-monto]");
    const notas = [];
    if (conMonto && pendientes) notas.push(`No incluye ${pendientes === 1 ? "1 ítem" : `${pendientes} ítems`} con precio por confirmar: Malhú te indicará el monto final.`);
    if (pedido.totales.hayCatering) notas.push("El catering es un costo estimado.");
    nota.textContent = notas.join(" ");
    nota.hidden = !notas.length;

    $("[data-pago-numero]").textContent = numeroLegible(yp.numero);
    $("[data-pago-titular]").textContent = yp.titular ? `A nombre de ${yp.titular}` : "";
    $("[data-pago-titular]").hidden = !yp.titular;

    const qrs = $("[data-pago-qrs]");
    qrs.replaceChildren();
    [["Yape", yp.qrYape], ["Plin", yp.qrPlin]].forEach(([nombre, ruta]) => {
      if (!ruta) return;
      const fig = document.createElement("figure");
      fig.className = "pago-qr";
      const img = document.createElement("img");
      img.src = ruta;
      img.alt = `Código QR de ${nombre} de Malhú`;
      img.width = 240;
      img.height = 240;
      img.decoding = "async";
      img.addEventListener("error", () => fig.remove(), { once: true }); // sin QR roto: queda el número
      const cap = document.createElement("figcaption");
      cap.textContent = nombre;
      fig.append(img, cap);
      qrs.append(fig);
    });
    qrs.hidden = !qrs.children.length;

    const pasos = [
      "Abre Yape o Plin en tu celular.",
      qrs.children.length ? "Escanea el código QR o paga al número de abajo." : "Paga al número de abajo.",
      conMonto ? `Envía exactamente ${formatoSoles(total)}.` : "Espera a que Malhú te confirme el monto antes de pagar.",
      conMonto ? "Escribe el número de operación de tu comprobante y el celular con el que pagaste, y toca “Ya realicé el pago”." : "Toca “Enviar pedido y esperar el monto”.",
    ];
    $("[data-pago-pasos]").replaceChildren(...pasos.map((t) => { const li = document.createElement("li"); li.textContent = t; return li; }));
    $("[data-pago-listo]").textContent = conMonto ? "Ya realicé el pago" : "Enviar pedido y esperar el monto";
    // Sin monto todavía no hay pago que verificar: no se pide código
    dialogo.querySelectorAll("[data-pago-campos-codigo]").forEach((c) => (c.hidden = !conMonto));
    $("#pago-operacion").value = "";
    $("#pago-celular").value = (pedido.cliente && pedido.cliente.celular) || "";
    ["#pago-operacion", "#pago-celular"].forEach((id) => {
      $(id).setAttribute("aria-invalid", "false");
      $(id + "-error").hidden = true;
    });

    dialogo.inert = false;
    dialogo.showModal();
    if (typeof Carrito !== "undefined") Carrito.bloquearFondo();
    if (!quieto()) dialogo.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 400, easing: EASE });
    $("#pago-titulo").focus();
  }

  /**
   * Abre el pago del método elegido.
   * alCompletar(resultado) recibe { metodo, nombreMetodo, estado, operacion? }.
   */
  function abrir({ metodo, pedido, origen: o, alCompletar: f }) {
    origen = o || document.activeElement;
    alCompletar = f;
    pedidoActual = pedido;
    if (metodo === "yapePlin") return abrirYapePlin(pedido);
    if (metodo === "efectivo") {
      alCompletar = null;
      return f({ metodo: "efectivo", nombreMetodo: "Efectivo al recoger", estado: "Pago al recoger" });
    }
    if (metodo === "tarjeta") {
      return pagarConTarjeta(pedido).then((r) => { if (r && r.ok) f(r); });
    }
  }

  return { metodos, abrir, numeroLegible };
})();

/**
 * Cobro con tarjeta (proveedor: Culqi Checkout v4).
 * Flujo real cuando se active:
 *   1. Se abre la ventana de Culqi (alojada por Culqi): la persona escribe su tarjeta AHÍ.
 *   2. Culqi devuelve un token (no el número de tarjeta).
 *   3. El token se envía a NUESTRO SERVIDOR (MALHU.tarjeta.endpointCargo), que crea el cargo
 *      con la llave secreta. La llave secreta nunca va en el navegador.
 *   4. Solo si el servidor responde que el cargo fue aprobado, el pedido queda "Pagado".
 * Mientras MALHU.tarjetaActiva sea false, no hace nada (la opción sale como "Próximamente").
 * @returns {Promise<{ok: boolean, metodo?: string, nombreMetodo?: string, estado?: string, motivo?: string}>}
 */
function pagarConTarjeta(pedido) {
  const t = (typeof MALHU !== "undefined" && MALHU.tarjeta) || {};
  if (!MALHU.tarjetaActiva || !t.llavePublica || !t.endpointCargo) {
    return Promise.resolve({ ok: false, motivo: "inactivo" });
  }
  const cargarCulqi = () => new Promise((ok, mal) => {
    if (window.Culqi) return ok(window.Culqi);
    const s = document.createElement("script");
    s.src = "https://checkout.culqi.com/js/v4";
    s.onload = () => ok(window.Culqi);
    s.onerror = () => mal(new Error("No cargó Culqi"));
    document.head.append(s);
  });
  return cargarCulqi().then((Culqi) => new Promise((resolver) => {
    Culqi.publicKey = t.llavePublica;
    Culqi.settings({
      title: "Malhú",
      currency: "PEN",
      amount: Math.round(pedido.totales.total * 100), // en céntimos
      order: pedido.numero,
    });
    window.culqi = async function () {
      if (!Culqi.token) { resolver({ ok: false, motivo: Culqi.error ? Culqi.error.user_message : "cancelado" }); return; }
      try {
        // Solo el token viaja a nuestro servidor; el servidor crea el cargo con la llave secreta
        const r = await fetch(t.endpointCargo, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: Culqi.token.id, pedido: pedido.numero, monto: Math.round(pedido.totales.total * 100), correo: pedido.cliente.correo }),
        }).then((x) => x.json());
        resolver(r && r.aprobado
          ? { ok: true, metodo: "tarjeta", nombreMetodo: "Tarjeta", estado: "Pagado" }
          : { ok: false, motivo: (r && r.mensaje) || "rechazado" });
      } catch (e) {
        resolver({ ok: false, motivo: "sin-conexion" });
      } finally {
        Culqi.close();
      }
    };
    Culqi.open();
  }));
}
