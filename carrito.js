/* ============================================================
   carrito.js · Malhú · carrito de compras (compartido)
   - Guarda los ítems en localStorage ("malhu_carrito"): sobrevive al recargar y se
     comparte entre páginas y pestañas. Lo guardado con el formato anterior se migra solo.
   - Cada ítem guarda todo lo necesario para mostrarse sin consultar otras páginas:
       { id, tipo: "plato" | "personalizado" | "catering", nombre, foto, emoji, alt,
         descripcion, categoria, cantidad, precioUnitario (o null),
         ingredientes: [{ nombre, cantidad, porcion, emoji }],
         nutricion: { kcal, proteina, carbo, grasa, vitaminas: [] } (o null),
         catering: { tipoId, evento, personas, personasMin, personasMax,
                     precioPorPersona, fecha, incluye: [] } }
   - Botón en la cabecera:  <button data-carrito-abrir> … <span data-carrito-cuenta></span></button>
   - "Ver detalle" y "Confirmar pedido" abren la ventana de detalle-pedido.js.
   Necesita app.js (formatoSoles) y visual.js; usa styles.css.
   ============================================================ */

const Carrito = (function () {
  // Función auxiliar para dar formato de Soles peruanos
function formatoSoles(monto) {
    if (typeof monto !== "number" || isNaN(monto)) return "S/ 0.00";
    return `S/ ${monto.toFixed(2)}`;
}
  const CLAVE = "malhu_carrito";
  const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
  const FOTO_PERSONALIZADO = "Slide Shows/Portada/Personaliza.jpg";
  const MAX_CANTIDAD = 99;
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quieto = () => reducir || document.documentElement.classList.contains("quieto");
  const avisos = new Set();
  const esNumero = (v) => typeof v === "number" && isFinite(v);
  const num = (v) => (esNumero(v) ? v : null);

  /* ---------- Datos ---------- */

  /** Convierte cualquier ítem (formato nuevo o anterior) al formato actual. */
  function normalizar(x) {
    if (!x || typeof x !== "object" || !x.id) return null;
    const cantidad = Math.max(1, Math.min(MAX_CANTIDAD, Math.round(Number(x.cantidad) || 1)));
    if (x.tipo === "catering") {
      const c = x.catering || {};
      const evento = c.evento || x.evento || "Catering";
      const datosTipo = typeof TIPOS !== "undefined" ? TIPOS.find((t) => t.id === c.tipoId || t.nombre === evento) : null;
      const personas = Math.round(Number(c.personas ?? x.personas)) || (datosTipo ? datosTipo.personasMin : 1);
      const tope = typeof PERSONAS_TOPE !== "undefined" ? PERSONAS_TOPE : 500;
      // Rango del tipo de evento; si no se conoce (ítem antiguo fuera de catering.html), queda null
      // y se completa solo al abrir el carrito en una página que tenga los datos
      const min = num(c.personasMin) ?? (datosTipo ? datosTipo.personasMin : null);
      const max = num(c.personasMax) ?? (datosTipo ? (esNumero(datosTipo.personasMax) ? datosTipo.personasMax : tope) : null);
      const costoViejo = num(x.costoEstimado) ?? num(x.precioUnitario) ?? num(x.precio);
      const ppp = num(c.precioPorPersona) ?? (datosTipo ? num(datosTipo.precioPorPersona) : null) ?? (costoViejo !== null && personas ? costoViejo / personas : null);
      return {
        id: x.id,
        tipo: "catering",
        nombre: `Catering · ${evento} · ${personas} personas`,
        foto: x.foto || (datosTipo ? datosTipo.foto : ""),
        alt: x.alt || (datosTipo ? datosTipo.alt : ""),
        emoji: x.emoji || (datosTipo && datosTipo.emoji) || "",
        descripcion: x.descripcion || (datosTipo ? datosTipo.descripcion : ""),
        categoria: "",
        cantidad: 1,
        precioUnitario: ppp !== null ? Math.round(ppp * personas * 100) / 100 : null,
        estimado: true,
        ingredientes: [],
        nutricion: null,
        catering: {
          tipoId: c.tipoId || (datosTipo ? datosTipo.id : ""),
          evento,
          personas,
          personasMin: min === null ? null : Math.min(min, personas),
          personasMax: max === null ? null : Math.max(max, personas),
          precioPorPersona: ppp,
          fecha: c.fecha ?? x.fecha ?? "",
          incluye: Array.isArray(c.incluye) ? c.incluye : (datosTipo && Array.isArray(datosTipo.incluye) ? datosTipo.incluye : []),
        },
      };
    }
    const personalizado = x.tipo === "personalizado" || String(x.id).startsWith("armado-");
    const n = x.nutricion || {};
    const nutricion = {
      kcal: num(n.kcal) ?? num(x.kcal),
      proteina: num(n.proteina) ?? num(x.proteina),
      carbo: num(n.carbo) ?? num(x.carbo) ?? num(x.carbohidratos),
      grasa: num(n.grasa) ?? num(x.grasa),
      vitaminas: Array.isArray(n.vitaminas) ? n.vitaminas : Array.isArray(x.vitaminas) ? x.vitaminas : [],
      parcial: !!n.parcial, // true = faltan datos de algún ingrediente (no se sumaron)
    };
    const conNutricion = ["kcal", "proteina", "carbo", "grasa"].some((k) => nutricion[k] !== null) || nutricion.vitaminas.length > 0;
    return {
      id: x.id,
      tipo: personalizado ? "personalizado" : "plato",
      nombre: x.nombre || "Plato",
      foto: x.foto || (personalizado ? FOTO_PERSONALIZADO : ""),
      alt: x.alt || "",
      emoji: x.emoji || "",
      descripcion: x.descripcion || "",
      categoria: x.categoria || "",
      cantidad,
      precioUnitario: num(x.precioUnitario) ?? num(x.precio),
      ingredientes: Array.isArray(x.ingredientes)
        ? x.ingredientes.filter((i) => i && i.nombre).map((i) => ({ nombre: i.nombre, cantidad: num(i.cantidad), porcion: i.porcion || "", emoji: i.emoji || "" }))
        : [],
      nutricion: conNutricion ? nutricion : null,
      catering: null,
    };
  }

  let migrado = false;
  function leer() {
    let crudo;
    try { crudo = JSON.parse(localStorage.getItem(CLAVE)); } catch (e) { crudo = null; }
    const lista = (Array.isArray(crudo) ? crudo : []).map(normalizar).filter(Boolean);
    // Una sola vez: si había ítems con el formato anterior, se guardan ya migrados (sin perder nada)
    if (!migrado) {
      migrado = true;
      if (Array.isArray(crudo) && crudo.some((x) => x && !("precioUnitario" in x))) {
        try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch (e) {}
      }
    }
    return lista;
  }
  const guardar = (lista) => {
    try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch (e) {}
    avisos.forEach((f) => f(lista));
  };

  /** Lo que llega de cada página → ítem. Platos del mismo id suman cantidad; cada catering es aparte. */
  function agregar(entrada) {
    const lista = leer();
    if (entrada.tipo === "catering") {
      const item = normalizar({
        id: "catering-" + Date.now(),
        tipo: "catering",
        foto: entrada.foto, alt: entrada.alt, emoji: entrada.emoji, descripcion: entrada.descripcion,
        costoEstimado: entrada.costoEstimado,
        catering: {
          tipoId: entrada.tipoId, evento: entrada.evento, personas: entrada.personas,
          personasMin: entrada.personasMin, personasMax: entrada.personasMax,
          precioPorPersona: entrada.precioPorPersona, fecha: entrada.fecha, incluye: entrada.incluye,
        },
      });
      lista.push(item);
      guardar(lista);
      return item;
    }
    const nuevo = normalizar(Object.assign({}, entrada, { cantidad: 1 }));
    const existente = lista.find((x) => x.id === nuevo.id);
    if (existente) {
      Object.assign(existente, nuevo, { cantidad: Math.min(MAX_CANTIDAD, existente.cantidad + 1) });
      guardar(lista);
      return existente;
    }
    lista.push(nuevo);
    guardar(lista);
    return nuevo;
  }

  function actualizar(id, cambio) {
    const lista = leer();
    const i = lista.findIndex((x) => x.id === id);
    if (i < 0) return null;
    cambio(lista[i]);
    lista[i] = normalizar(lista[i]); // recalcula nombre y costo del catering
    guardar(lista);
    return lista[i];
  }
  const cambiar = (id, delta) =>
    actualizar(id, (x) => { x.cantidad = Math.max(1, Math.min(MAX_CANTIDAD, x.cantidad + delta)); });
  const cambiarPersonas = (id, valor) =>
    actualizar(id, (x) => {
      const c = x.catering;
      const min = c.personasMin ?? c.personas, max = c.personasMax ?? c.personas;
      c.personas = Math.max(min, Math.min(max, Math.round(valor) || min));
    });
  const cambiarFecha = (id, fecha) => actualizar(id, (x) => { x.catering.fecha = fecha || ""; });
  function quitar(id) {
    const lista = leer();
    const i = lista.findIndex((x) => x.id === id);
    if (i < 0) return null;
    const [item] = lista.splice(i, 1);
    guardar(lista);
    return { item, indice: i };
  }
  function restaurar(item, indice) {
    const lista = leer();
    lista.splice(Math.min(indice, lista.length), 0, item);
    guardar(lista);
  }
  const vaciar = () => guardar([]);
  const cuenta = () => leer().reduce((s, x) => s + x.cantidad, 0);

  /** Costo de una línea (null si no tiene precio). */
  const subtotalDe = (x) => (esNumero(x.precioUnitario) ? x.precioUnitario * x.cantidad : null);

  /** Totales: el subtotal suma solo lo que tiene precio; si nada tiene precio, el total es null. */
  function resumen(lista = leer()) {
    const conPrecio = lista.filter((x) => esNumero(x.precioUnitario));
    const subtotal = conPrecio.reduce((s, x) => s + subtotalDe(x), 0);
    return {
      subtotal,
      pendientes: lista.length - conPrecio.length,
      total: conPrecio.length ? subtotal : null,
      hayCatering: lista.some((x) => x.tipo === "catering"),
      hayPlatos: lista.some((x) => x.tipo !== "catering"),
      items: lista.length,
      unidades: lista.reduce((s, x) => s + x.cantidad, 0),
    };
  }
  const textoPrecio = (v) => (esNumero(v) ? formatoSoles(v) : "Por confirmar");
  const total = () => resumen().total;
  const alCambiar = (f) => avisos.add(f);

  // Otra pestaña cambió el carrito
  addEventListener("storage", (e) => { if (e.key === CLAVE) avisos.forEach((f) => f(leer())); });

  /* ---------- Interfaz ---------- */
  const ICO = {
    menos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    papelera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };
  const el = (tag, clase, texto) => {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  };
  const boton = (clase, html, etiqueta) => {
    const b = el("button", clase);
    b.type = "button";
    b.innerHTML = html;
    if (etiqueta) b.setAttribute("aria-label", etiqueta);
    return b;
  };
  /** aria-disabled en vez de disabled: el botón conserva el foco al llegar al límite. */
  const habilitar = (b, si) => b.setAttribute("aria-disabled", String(!si));
  const activo = (b) => b.getAttribute("aria-disabled") !== "true";
  const fechaLegible = (iso) => {
    try { return new Date(iso + "T12:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }); }
    catch (e) { return iso; }
  };

  let alAgregarVisual = () => {};
  let abrirPanel = () => {};
  let enfocarPanel = () => {};

  function montar() {
    const panel = document.createElement("dialog");
    panel.className = "carrito";
    panel.inert = true; // cerrado: nada adentro recibe foco
    panel.setAttribute("aria-labelledby", "carrito-titulo");
    panel.innerHTML = `
      <div class="carrito-in">
        <div class="carrito-cabeza">
          <h2 id="carrito-titulo" tabindex="-1">Tu carrito</h2>
          <button class="btn btn-redondo" type="button" data-carrito-cerrar aria-label="Cerrar carrito">${ICO.cerrar}</button>
        </div>
        <ul class="carrito-lista" aria-label="Productos en tu carrito"></ul>
        <div class="carrito-vacio" hidden>
          <p class="carrito-vacio-titulo">Tu carrito está vacío.</p>
          <p>Elige platos del día, arma tu plato o cotiza un catering.</p>
          <div class="carrito-vacio-enlaces">
            <a class="btn btn-primario" href="plato-menu.html">Ver platos del día</a>
            <a class="btn btn-fantasma" href="plato-personalizado.html">Arma tu plato</a>
            <a class="btn btn-fantasma" href="catering.html">Ver catering</a>
          </div>
        </div>
        <div class="carrito-deshacer" hidden>
          <p class="carrito-deshacer-texto"></p>
          <button class="carrito-deshacer-btn" type="button">Deshacer</button>
        </div>
        <div class="carrito-pie">
          <dl class="carrito-resumen">
            <div class="carrito-fila"><dt>Subtotal <span class="carrito-sub">(ítems con precio)</span></dt><dd class="dato" data-carrito-subtotal></dd></div>
            <div class="carrito-fila carrito-pendientes" data-carrito-pendientes hidden><dt>Por confirmar</dt><dd></dd></div>
            <div class="carrito-fila carrito-total"><dt>Total estimado</dt><dd data-carrito-total></dd></div>
          </dl>
          <p class="carrito-nota" data-carrito-nota-estimado hidden>El costo del catering es estimado. Malhú confirma el precio final.</p>
          <button class="btn btn-primario carrito-confirmar" type="button">Confirmar pedido</button>
          <p class="carrito-mensaje" role="status"></p>
          <div class="carrito-vaciar-zona">
            <button class="carrito-vaciar" type="button">Vaciar carrito</button>
            <div class="carrito-vaciar-confirma" hidden>
              <p id="carrito-vaciar-pregunta">¿Vaciar todo el carrito?</p>
              <div class="carrito-vaciar-botones">
                <button class="btn btn-fantasma carrito-vaciar-si" type="button" aria-describedby="carrito-vaciar-pregunta">Sí, vaciar</button>
                <button class="btn btn-fantasma carrito-vaciar-no" type="button">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
        <p class="sr" aria-live="polite" data-carrito-anuncio></p>
      </div>`;
    document.body.append(panel);

    // Aviso visible al agregar desde la página (role="status": el lector también lo anuncia)
    const aviso = el("div", "aviso-carrito");
    aviso.setAttribute("role", "status");
    document.body.append(aviso);

    const $ = (s) => panel.querySelector(s);
    const lista = $(".carrito-lista");
    const mensaje = $(".carrito-mensaje");
    const titulo = $("#carrito-titulo");
    const anuncio = $("[data-carrito-anuncio]");
    let disparador = null;
    const tarjetas = new Map(); // id → { li, pintar(x), detalle }
    const leerItem = (id) => leer().find((x) => x.id === id);

    let tAnuncio;
    function anunciar(texto) {
      clearTimeout(tAnuncio);
      tAnuncio = setTimeout(() => (anuncio.textContent = texto), 300);
    }
    const textoTotal = () => {
      const r = resumen();
      return r.total === null ? "Total por confirmar" : `Total ${formatoSoles(r.total)}`;
    };

    function crearPaso() {
      const grupo = el("div", "carrito-paso-grupo");
      grupo.setAttribute("role", "group");
      const menos = boton("carrito-paso", ICO.menos);
      const n = el("span", "carrito-cantidad dato");
      const mas = boton("carrito-paso", ICO.mas);
      grupo.append(menos, n, mas);
      return { grupo, menos, mas, n };
    }

    /* ----- Tarjeta de un ítem ----- */
    function crearTarjeta(x) {
      const li = el("li", "carrito-item");
      li.dataset.id = x.id;
      const media = el("div", "carrito-media");
      const cuerpo = el("div", "carrito-cuerpo");
      const nombre = el("p", "carrito-nombre");
      const unidad = el("p", "carrito-unidad dato");
      const controles = el("div", "carrito-controles");
      const linea = el("span", "carrito-linea dato");
      const acciones = el("div", "carrito-acciones");
      const detalle = boton("carrito-detalle", "Ver detalle");
      const papelera = boton("carrito-quitar", ICO.papelera);
      acciones.append(detalle, papelera);
      const paso = crearPaso();
      let fecha = null;

      if (x.tipo === "catering") {
        li.classList.add("carrito-item--catering");
        const personas = el("div", "carrito-campo");
        personas.append(el("span", "carrito-etq", "Personas"), paso.grupo);
        const campoFecha = el("div", "carrito-campo");
        const etq = el("label", "carrito-etq", "Fecha");
        etq.htmlFor = "carrito-fecha-" + x.id;
        fecha = el("input", "carrito-fecha-input");
        fecha.type = "date";
        fecha.id = "carrito-fecha-" + x.id;
        const d = new Date();
        fecha.min = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        fecha.addEventListener("change", () => {
          cambiarFecha(x.id, fecha.value);
          anunciar(fecha.value ? `Fecha del catering: ${fechaLegible(fecha.value)}.` : "Fecha por definir.");
        });
        campoFecha.append(etq, fecha);
        controles.append(personas, campoFecha);
        cuerpo.append(nombre, unidad, controles);
        const mover = (delta) => {
          const it = leerItem(x.id);
          if (!it) return;
          const r = cambiarPersonas(x.id, it.catering.personas + delta);
          if (r) anunciar(`${r.catering.evento}, ${r.catering.personas} personas. ${textoTotal()}.`);
        };
        paso.menos.addEventListener("click", () => { if (activo(paso.menos)) mover(-1); });
        paso.mas.addEventListener("click", () => { if (activo(paso.mas)) mover(+1); });
      } else {
        controles.append(paso.grupo);
        cuerpo.append(nombre, unidad, controles);
        const mover = (delta) => {
          const r = cambiar(x.id, delta);
          if (r) anunciar(`${r.nombre}, ${r.cantidad}. ${textoTotal()}.`);
        };
        paso.menos.addEventListener("click", () => { if (activo(paso.menos)) mover(-1); });
        paso.mas.addEventListener("click", () => { if (activo(paso.mas)) mover(+1); });
      }
      const pie = el("div", "carrito-item-pie");
      pie.append(linea, acciones);
      cuerpo.append(pie);

      detalle.addEventListener("click", () => {
        if (typeof DetallePedido !== "undefined") DetallePedido.abrir({ expandir: x.id, origen: detalle });
      });
      papelera.addEventListener("click", () => eliminar(x.id));

      media.append(Visual.imagen(x, "miniatura", { alt: "" }));
      li.append(media, cuerpo);

      function pintar(it) {
        nombre.textContent = it.nombre;
        detalle.setAttribute("aria-label", `Ver detalle de ${it.nombre}`);
        papelera.setAttribute("aria-label", `Eliminar ${it.nombre} del carrito`);
        const sub = subtotalDe(it);
        linea.textContent = sub === null ? "Por confirmar" : formatoSoles(sub);
        linea.classList.toggle("sin-precio", sub === null);
        if (it.tipo === "catering") {
          const c = it.catering;
          paso.n.textContent = c.personas;
          const min = c.personasMin ?? c.personas, max = c.personasMax ?? c.personas;
          paso.grupo.setAttribute("aria-label", c.personasMin === null ? `Personas para ${c.evento}` : `Personas para ${c.evento}, de ${min} a ${max}`);
          paso.menos.setAttribute("aria-label", "Una persona menos");
          paso.mas.setAttribute("aria-label", "Una persona más");
          habilitar(paso.menos, c.personas > min);
          habilitar(paso.mas, c.personas < max);
          unidad.textContent = esNumero(c.precioPorPersona)
            ? `${formatoSoles(c.precioPorPersona)} por persona · estimado`
            : "Costo estimado por confirmar";
          if (document.activeElement !== fecha) fecha.value = c.fecha || "";
        } else {
          paso.n.textContent = it.cantidad;
          paso.grupo.setAttribute("aria-label", `Cantidad de ${it.nombre}`);
          paso.menos.setAttribute("aria-label", `Quitar uno de ${it.nombre}`);
          paso.mas.setAttribute("aria-label", `Agregar uno de ${it.nombre}`);
          habilitar(paso.menos, it.cantidad > 1);
          habilitar(paso.mas, it.cantidad < MAX_CANTIDAD);
          unidad.textContent = esNumero(it.precioUnitario) ? `${formatoSoles(it.precioUnitario)} c/u` : "Precio por confirmar";
        }
      }
      pintar(x);
      return { li, pintar, detalle };
    }

    /* ----- Eliminar con "Deshacer" (sin ventanas de confirmación) ----- */
    const barraDeshacer = $(".carrito-deshacer");
    const textoDeshacer = $(".carrito-deshacer-texto");
    const btnDeshacer = $(".carrito-deshacer-btn");
    let ultimoQuitado = null;
    let tDeshacer;
    function eliminar(id) {
      const pos = [...tarjetas.keys()].indexOf(id);
      const r = quitar(id); // pinta: la tarjeta sale de la lista
      if (!r) return;
      ultimoQuitado = r;
      textoDeshacer.textContent = `Quitaste ${r.item.nombre}.`;
      barraDeshacer.hidden = false;
      anunciar(`Quitaste ${r.item.nombre}. ${textoTotal()}.`);
      clearTimeout(tDeshacer);
      tDeshacer = setTimeout(() => {
        if (barraDeshacer.contains(document.activeElement)) titulo.focus();
        barraDeshacer.hidden = true;
        ultimoQuitado = null;
      }, 8000);
      // El foco pasa a la papelera del ítem siguiente (o anterior); si no quedan, a "Deshacer"
      const restantes = [...tarjetas.values()];
      const destino = restantes[Math.min(pos, restantes.length - 1)];
      (destino ? destino.li.querySelector(".carrito-quitar") : btnDeshacer).focus();
    }
    btnDeshacer.addEventListener("click", () => {
      if (!ultimoQuitado) return;
      const { item, indice } = ultimoQuitado;
      ultimoQuitado = null;
      clearTimeout(tDeshacer);
      restaurar(item, indice);
      const t = tarjetas.get(item.id);
      if (t) t.detalle.focus();
      barraDeshacer.hidden = true;
      anunciar(`${item.nombre} volvió a tu carrito. ${textoTotal()}.`);
    });

    /* ----- Vaciar en dos pasos, en línea ----- */
    const btnVaciar = $(".carrito-vaciar");
    const confirmaVaciar = $(".carrito-vaciar-confirma");
    const pedirConfirmacion = (si) => {
      btnVaciar.hidden = si;
      confirmaVaciar.hidden = !si;
    };
    btnVaciar.addEventListener("click", () => { pedirConfirmacion(true); $(".carrito-vaciar-no").focus(); });
    $(".carrito-vaciar-no").addEventListener("click", () => { pedirConfirmacion(false); btnVaciar.focus(); });
    $(".carrito-vaciar-si").addEventListener("click", () => {
      pedirConfirmacion(false);
      vaciar();
      barraDeshacer.hidden = true;
      ultimoQuitado = null;
      anunciar("Vaciaste el carrito.");
      $(".carrito-vacio a").focus();
    });

    /* ----- Pintar en el lugar: las tarjetas existentes se actualizan, no se reemplazan ----- */
    function pintar() {
      const items = leer();
      const ids = new Set(items.map((x) => x.id));
      tarjetas.forEach((t, id) => { if (!ids.has(id)) { t.li.remove(); tarjetas.delete(id); } });
      items.forEach((x, k) => {
        let t = tarjetas.get(x.id);
        if (!t) { t = crearTarjeta(x); tarjetas.set(x.id, t); }
        else t.pintar(x);
        if (lista.children[k] !== t.li) lista.insertBefore(t.li, lista.children[k] || null);
      });
      const orden = items.map((x) => [x.id, tarjetas.get(x.id)]);
      tarjetas.clear();
      orden.forEach(([k, v]) => tarjetas.set(k, v));

      const vacio = items.length === 0;
      lista.hidden = vacio;
      $(".carrito-vacio").hidden = !vacio;
      $(".carrito-pie").hidden = vacio;
      if (vacio) pedirConfirmacion(false);
      const r = resumen(items);
      $("[data-carrito-subtotal]").textContent = formatoSoles(r.subtotal);
      const pend = $("[data-carrito-pendientes]");
      pend.hidden = r.pendientes === 0;
      pend.querySelector("dd").textContent = r.pendientes === 1 ? "1 ítem" : `${r.pendientes} ítems`;
      pend.querySelector("dt").textContent = "Con precio por confirmar";
      const tot = $("[data-carrito-total]");
      tot.textContent = textoPrecio(r.total); // nunca "S/ 0.00" si todo está por confirmar
      tot.classList.toggle("sin-precio", r.total === null);
      $("[data-carrito-nota-estimado]").hidden = !r.hayCatering;

      const n = r.unidades;
      document.querySelectorAll("[data-carrito-cuenta]").forEach((b) => {
        b.textContent = n;
        b.hidden = n === 0;
      });
      // Monto acumulado visible en el botón de la cabecera (se va sumando al agregar)
      const montoBoton = r.total === null ? (n ? "Por confirmar" : "") : formatoSoles(r.total);
      document.querySelectorAll("[data-carrito-abrir]").forEach((b) => {
        let m = b.querySelector(".carrito-boton-total");
        if (!m) {
          m = el("span", "carrito-boton-total dato");
          m.setAttribute("aria-hidden", "true"); // el monto ya va en el aria-label del botón
          b.append(m);
        }
        const cambio = m.textContent !== montoBoton;
        m.textContent = montoBoton;
        m.hidden = n === 0;
        if (cambio && n && !quieto()) m.animate([{ transform: "translateY(6px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 400, easing: EASE });
        b.setAttribute("aria-label", `Abrir carrito, ${n} ${n === 1 ? "producto" : "productos"}${n ? `, total ${r.total === null ? "por confirmar" : formatoSoles(r.total)}` : ""}`);
      });
    }

    /* ----- Abrir y cerrar ----- */
    function abrir(origen) {
      disparador = origen || document.activeElement;
      mensaje.textContent = "";
      pintar();
      panel.inert = false;
      panel.showModal(); // modal: atrapa el foco; el resto de la página queda inerte
      bloquearFondo();
      if (!quieto()) panel.animate([{ transform: "translateX(100%)" }, { transform: "translateX(0)" }], { duration: 450, easing: EASE });
    }
    abrirPanel = abrir;
    enfocarPanel = () => { if (panel.open) titulo.focus(); };
    function cerrar() {
      if (!panel.open) return;
      if (quieto()) { panel.close(); return; }
      const a = panel.animate([{ transform: "translateX(0)" }, { transform: "translateX(100%)" }], { duration: 220, easing: EASE });
      a.onfinish = () => panel.close();
    }
    panel.addEventListener("close", () => {
      panel.inert = true;
      bloquearFondo();
      if (disparador && disparador.isConnected && disparador.focus) disparador.focus(); // devuelve el foco a su botón
    });
    panel.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(); }); // Escape
    panel.addEventListener("click", (e) => {
      if (e.target === panel || e.target.closest("[data-carrito-cerrar]")) cerrar();
    });

    // "Confirmar pedido" → ventana de detalle → confirmar-pedido.html, que guarda el pedido en Firestore
    $(".carrito-confirmar").addEventListener("click", (e) => {
      const items = leer();
      if (!items.length || typeof DetallePedido === "undefined") return;
      DetallePedido.abrir({ expandir: items[0].id, origen: e.currentTarget });
    });

    document.querySelectorAll("[data-carrito-abrir]").forEach((b) => b.addEventListener("click", () => abrir(b)));

    alCambiar(pintar);
    pintar();
    // Enlace directo al carrito (ej. plato-menu.html#carrito desde una página que quedó sin ítems)
    if (location.hash === "#carrito") abrir(null);

    let tAviso;
    alAgregarVisual = (texto) => {
      aviso.textContent = texto;
      aviso.classList.add("visible");
      clearTimeout(tAviso);
      tAviso = setTimeout(() => aviso.classList.remove("visible"), 2600);
      if (quieto()) return;
      // el contador de la cabecera salta una vez (el foco no se mueve)
      document.querySelectorAll("[data-carrito-abrir]").forEach((b) =>
        b.animate([{ transform: "scale(1)" }, { transform: "scale(1.14)" }, { transform: "scale(1)" }], { duration: 450, easing: EASE })
      );
    };
  }

  /** Sin scroll de fondo mientras haya un diálogo abierto. */
  function bloquearFondo() {
    document.documentElement.classList.toggle("sin-scroll", !!document.querySelector("dialog[open]"));
  }

  document.addEventListener("DOMContentLoaded", montar);

  return {
    agregar(entrada) {
      const item = agregar(entrada);
      const n = cuenta();
      const t = resumen().total;
      alAgregarVisual(`Agregaste ${item.nombre}. ${n} ${n === 1 ? "producto" : "productos"} · Total ${t === null ? "por confirmar" : formatoSoles(t)}`);
      return item;
    },
    abrir: (origen) => abrirPanel(origen),
    enfocar: () => enfocarPanel(),
    bloquearFondo,
    cambiar, cambiarPersonas, cambiarFecha, quitar, restaurar, vaciar, cuenta, total, leer, resumen,
    subtotalDe, textoPrecio, alCambiar, normalizar, fechaLegible,
  };
})();
