/* ============================================================
   detalle-pedido.js · Malhú · ventana "¿Seguro de tu compra?"
   - Se abre desde "Confirmar pedido" (primer ítem desplegado) y desde
     "Ver detalle" de un ítem (ese ítem desplegado y visible). Es el mismo componente.
   - "Confirmar" lleva a confirmar-pedido.html (datos, pago y recojo).
     Las notas y la casilla del plan viajan en sessionStorage ("malhu-borrador-pedido").
   - DetallePedido.agregarAlPlan(items) lo usa confirmar-pedido.js al terminar.
   Necesita app.js, visual.js y carrito.js; usa styles.css.
   ============================================================ */

const DetallePedido = (function () {
  const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quieto = () => reducir || document.documentElement.classList.contains("quieto");
  const esNumero = (v) => typeof v === "number" && isFinite(v);
  const fmt = (n, dec = 0) => n.toLocaleString("es-PE", { maximumFractionDigits: dec });
  const BORRADOR = "malhu-borrador-pedido";
  const ICO_CERRAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const ICO_MAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path class="dp-vertical" d="M12 5v14"/><path d="M5 12h14"/></svg>';

  const el = (tag, clase, texto) => {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  };

  let dialogo, lista, origen = null, saliendo = false;
  const abiertos = new Set();

  function montar() {
    dialogo = document.createElement("dialog");
    dialogo.className = "dp";
    dialogo.inert = true;
    dialogo.setAttribute("role", "dialog");
    dialogo.setAttribute("aria-modal", "true");
    dialogo.setAttribute("aria-labelledby", "dp-titulo");
    dialogo.innerHTML = `
      <div class="dp-cabeza">
        <h2 id="dp-titulo" tabindex="-1">¿Seguro de tu compra?</h2>
        <button class="btn btn-redondo" type="button" data-dp-cerrar aria-label="Cerrar y volver al carrito">${ICO_CERRAR}</button>
      </div>
      <div class="dp-scroll">
        <div class="dp-vista">
          <ul class="dp-lista" aria-label="Productos de tu pedido"></ul>
          <form class="dp-form" novalidate>
            <dl class="dp-resumen">
              <div class="dp-fila-res"><dt>Subtotal <span class="dp-sub">(ítems con precio)</span></dt><dd class="dato" data-dp-subtotal></dd></div>
              <div class="dp-fila-res" data-dp-pendientes hidden><dt>Con precio por confirmar</dt><dd class="dato"></dd></div>
              <div class="dp-fila-res dp-total"><dt>Total estimado</dt><dd data-dp-total></dd></div>
            </dl>
            <p class="dp-nota" data-dp-nota-catering hidden>El costo del catering es estimado. Malhú confirma el precio final.</p>
            <div class="dp-campo">
              <label for="dp-notas">Notas <span class="dp-opc">(opcional)</span></label>
              <textarea class="campo" id="dp-notas" rows="3" placeholder="Ej. sin cebolla, salsa aparte"></textarea>
            </div>
            <label class="dp-casilla" data-dp-plan-caja hidden><input type="checkbox" id="dp-plan" checked> Agregar los platos a mi plan de hoy</label>
            <div class="dp-botones">
              <button class="btn btn-primario" type="submit">Confirmar</button>
              <button class="btn btn-fantasma" type="button" data-dp-cerrar>Volver al carrito</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.append(dialogo);

    const $ = (s) => dialogo.querySelector(s);
    lista = $(".dp-lista");

    // Notas guardadas de un intento anterior
    try {
      const b = JSON.parse(sessionStorage.getItem(BORRADOR));
      if (b && b.notas) $("#dp-notas").value = b.notas;
    } catch (e) {}

    /* ----- "Confirmar": pasa a la confirmación de datos ----- */
    $(".dp-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!Carrito.leer().length) return;
      try {
        sessionStorage.setItem(BORRADOR, JSON.stringify({
          notas: $("#dp-notas").value.trim(),
          agregarPlan: !$("[data-dp-plan-caja]").hidden && $("#dp-plan").checked,
        }));
      } catch (er) {}
      saliendo = true;
      location.href = "confirmar-pedido.html";
    });

    dialogo.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(); }); // Escape
    dialogo.addEventListener("click", (e) => {
      if (e.target === dialogo || e.target.closest("[data-dp-cerrar]")) cerrar();
    });
    dialogo.addEventListener("close", () => {
      dialogo.inert = true;
      Carrito.bloquearFondo();
      if (saliendo) return;
      // Devuelve el foco al botón que abrió; si ya no está visible, al título del carrito
      if (origen && origen.isConnected && origen.offsetParent !== null) origen.focus();
      else Carrito.enfocar();
    });

    // El detalle refleja al instante cualquier cambio del carrito (por ejemplo, desde otra pestaña)
    Carrito.alCambiar(() => { if (dialogo.open) pintar(); });
  }

  /* ---------- Contenido de cada ítem ---------- */
  function seccion(titulo, contenido) {
    const s = el("section", "dp-seccion");
    s.append(el("h4", "dp-sub-titulo", titulo), contenido);
    return s;
  }
  function filas(pares, clase = "dp-datos") {
    const dl = el("dl", clase);
    pares.forEach(([k, v]) => {
      const f = el("div", "dp-dato");
      f.append(el("dt", "", k), el("dd", "", v));
      dl.append(f);
    });
    return dl;
  }
  function textoVitaminas(v) {
    if (!v || !v.length) return "—";
    return v.length === 1 ? v[0] : `${v.slice(0, -1).join(", ")} y ${v[v.length - 1]}`;
  }

  function contenidoItem(x) {
    const caja = el("div", "dp-contenido");
    caja.append(Visual.imagen(x, "grande"));
    const datos = el("div", "dp-secciones");
    if (x.descripcion) datos.append(el("p", "dp-desc", x.descripcion));

    if (x.tipo === "catering") {
      const c = x.catering;
      if (c.incluye && c.incluye.length) {
        const ul = el("ul", "dp-lista-simple");
        c.incluye.forEach((t) => ul.append(el("li", "", t)));
        datos.append(seccion("Qué incluye", ul));
      }
      datos.append(seccion("Tu evento", filas([
        ["Tipo de evento", c.evento],
        ["Personas", c.personasMin === null ? String(c.personas) : `${c.personas} (de ${c.personasMin} a ${c.personasMax})`],
        ["Fecha", c.fecha ? Carrito.fechaLegible(c.fecha) : "Por definir"],
      ])));
      datos.append(seccion("Costo estimado", filas([
        ["Por persona", esNumero(c.precioPorPersona) ? formatoSoles(c.precioPorPersona) : "Por confirmar"],
        ["Total del catering", Carrito.textoPrecio(Carrito.subtotalDe(x))],
      ], "dp-datos dp-costo")));
      return armar(caja, datos);
    }

    if (x.ingredientes.length) {
      const ul = el("ul", "dp-lista-simple");
      x.ingredientes.forEach((i) => {
        const partes = [i.nombre];
        if (esNumero(i.cantidad) && (x.tipo === "personalizado" || i.cantidad > 1)) partes.push(`× ${i.cantidad}`);
        if (i.porcion) partes.push(`· ${i.porcion}`);
        ul.append(el("li", "", partes.join(" ")));
      });
      datos.append(seccion("Ingredientes", ul));
    }
    if (x.nutricion) {
      const n = x.nutricion;
      const g = (v) => (esNumero(v) ? `${fmt(v, 1)} g` : "—");
      const tabla = filas([
        ["Calorías", esNumero(n.kcal) ? `${fmt(n.kcal)} kcal` : "—"],
        ["Proteína", g(n.proteina)],
        ["Carbohidratos", g(n.carbo)],
        ["Grasa", g(n.grasa)],
        ["Vitaminas", textoVitaminas(n.vitaminas)],
      ], "dp-datos dp-nutri");
      const cajaNutri = el("div", "dp-nutri-caja");
      cajaNutri.append(tabla);
      if (n.parcial) cajaNutri.append(el("p", "dp-nota", "Valores aproximados sin contar los ingredientes que aún no tienen datos."));
      datos.append(seccion("Valor nutricional (por plato)", cajaNutri));
    }
    const pares = [];
    if (esNumero(x.precioUnitario)) pares.push(["Precio", `${formatoSoles(x.precioUnitario)} × ${x.cantidad}`]);
    pares.push(["Costo", Carrito.textoPrecio(Carrito.subtotalDe(x))]);
    datos.append(seccion("Costo", filas(pares, "dp-datos dp-costo")));
    return armar(caja, datos);
  }
  const armar = (caja, datos) => { caja.append(datos); return caja; };

  function tarjeta(x, k) {
    const li = el("li", "dp-item");
    li.dataset.id = x.id;
    const fila = el("div", "dp-fila");
    const texto = el("div", "dp-texto");
    texto.append(el("h3", "dp-nombre", x.nombre));
    const costo = Carrito.textoPrecio(Carrito.subtotalDe(x));
    texto.append(el("p", "dp-meta dato", x.tipo === "catering"
      ? `${x.catering.personas} personas · ${costo}${esNumero(x.precioUnitario) ? " (estimado)" : ""}`
      : `× ${x.cantidad} · ${costo}`));
    const toggle = el("button", "dp-toggle");
    toggle.type = "button";
    toggle.innerHTML = ICO_MAS;
    const idCuerpo = `dp-cuerpo-${k}`;
    toggle.setAttribute("aria-controls", idCuerpo);
    fila.append(Visual.imagen(x, "miniatura", { alt: "" }), texto, toggle);

    const cuerpo = el("div", "dp-cuerpo");
    cuerpo.id = idCuerpo;
    const interior = el("div", "dp-cuerpo-in");
    interior.append(contenidoItem(x));
    cuerpo.append(interior);

    const fijar = (abierto) => {
      cuerpo.classList.toggle("abierto", abierto);
      interior.inert = !abierto;
      toggle.setAttribute("aria-expanded", String(abierto));
      toggle.setAttribute("aria-label", `${abierto ? "Ocultar" : "Ver"} detalle de ${x.nombre}`);
      li.classList.toggle("abierto", abierto);
      if (abierto) abiertos.add(x.id); else abiertos.delete(x.id);
    };
    fijar(abiertos.has(x.id));
    toggle.addEventListener("click", () => fijar(!cuerpo.classList.contains("abierto")));

    li.append(fila, cuerpo);
    return li;
  }

  function pintarResumen(dl, r) {
    dl.querySelector("[data-dp-subtotal]").textContent = formatoSoles(r.subtotal);
    const p = dl.querySelector("[data-dp-pendientes]");
    p.hidden = r.pendientes === 0;
    p.querySelector("dd").textContent = r.pendientes === 1 ? "1 ítem" : `${r.pendientes} ítems`;
    const t = dl.querySelector("[data-dp-total]");
    t.textContent = Carrito.textoPrecio(r.total);
    t.classList.toggle("sin-precio", r.total === null);
  }

  function pintar() {
    const items = Carrito.leer();
    // Conserva el foco si estaba en un botón "+/−"
    const enfocado = lista.contains(document.activeElement) ? document.activeElement.closest(".dp-item") : null;
    const idEnfocado = enfocado && enfocado.dataset.id;
    lista.replaceChildren(...items.map(tarjeta));
    if (idEnfocado) {
      const b = lista.querySelector(`[data-id="${CSS.escape(idEnfocado)}"] .dp-toggle`);
      if (b) b.focus();
    }
    const r = Carrito.resumen(items);
    pintarResumen(dialogo.querySelector(".dp-vista .dp-resumen"), r);
    dialogo.querySelector("[data-dp-nota-catering]").hidden = !r.hayCatering;
    dialogo.querySelector("[data-dp-plan-caja]").hidden = !r.hayPlatos;
    if (!items.length && dialogo.open) cerrar();
  }

  /* ---------- Abrir / cerrar ---------- */
  function abrir({ expandir, origen: o } = {}) {
    if (!dialogo) return;
    origen = o || document.activeElement;
    abiertos.clear();
    if (expandir) abiertos.add(expandir);
    dialogo.querySelector("#dp-plan").checked = true;
    pintar();
    dialogo.inert = false;
    dialogo.showModal();
    Carrito.bloquearFondo();
    if (!quieto()) dialogo.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 400, easing: EASE });
    // Desde "Ver detalle": ese ítem queda visible y con el foco; desde "Confirmar": el título
    const item = expandir && lista.querySelector(`[data-id="${CSS.escape(expandir)}"]`);
    const desdeDetalle = o && o.classList && o.classList.contains("carrito-detalle");
    if (item && desdeDetalle) {
      const scroll = dialogo.querySelector(".dp-scroll");
      const llevar = () => { scroll.scrollTop = item.offsetTop - 12; };
      llevar();
      requestAnimationFrame(llevar);
      item.querySelector(".dp-toggle").focus({ preventScroll: true });
    } else {
      dialogo.querySelector(".dp-scroll").scrollTop = 0;
      dialogo.querySelector("#dp-titulo").focus();
    }
  }
  function cerrar() {
    if (!dialogo.open) return;
    if (quieto()) { dialogo.close(); return; }
    const a = dialogo.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.98)" }], { duration: 180, easing: EASE });
    a.onfinish = () => dialogo.close();
  }

  /* ---------- Plan de hoy (lo usa confirmar-pedido.js al terminar) ---------- */
  function agregarAlPlan(items) {
    const comidas = items.filter((x) => x.tipo !== "catering").map((x) => {
      const n = x.nutricion || {};
      const por = (v) => (esNumero(v) ? v * x.cantidad : null);
      return {
        nombre: x.nombre + (x.cantidad > 1 ? ` ×${x.cantidad}` : ""),
        kcal: por(n.kcal), proteina: por(n.proteina), carbo: por(n.carbo), grasa: por(n.grasa),
        incompleto: !x.nutricion || ["kcal", "proteina", "carbo", "grasa"].some((k) => !esNumero(n[k])),
      };
    });
    if (typeof PlanHoy !== "undefined") { comidas.forEach((c) => PlanHoy.agregar(c)); return; }
    // Fuera de "Arma tu plato": se escribe en el mismo formato que usa plan.js
    try {
      const d = new Date();
      const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const g = JSON.parse(localStorage.getItem("malhu-plan"));
      const actuales = g && g.fecha === hoy && Array.isArray(g.comidas) ? g.comidas : [];
      const nuevas = comidas.map((c, k) => ({
        id: `c-${Date.now()}-${k}`,
        nombre: c.nombre,
        kcal: esNumero(c.kcal) ? Math.round(c.kcal) : null,
        proteina: esNumero(c.proteina) ? Math.round(c.proteina * 10) / 10 : null,
        carbo: esNumero(c.carbo) ? Math.round(c.carbo * 10) / 10 : null,
        grasa: esNumero(c.grasa) ? Math.round(c.grasa * 10) / 10 : null,
        incompleto: c.incompleto,
        hora: d.toTimeString().slice(0, 5),
      }));
      localStorage.setItem("malhu-plan", JSON.stringify({ fecha: hoy, comidas: actuales.concat(nuevas) }));
    } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", montar);
  return { abrir, cerrar, agregarAlPlan };
})();
