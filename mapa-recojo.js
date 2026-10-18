/* ============================================================
   mapa-recojo.js · Malhú · ventana "Mapa" y miniatura
   - MapaRecojo.abrir({ seleccion, origen, alListo }) abre el diálogo:
     mapa (Leaflet 1.9.4 + teselas de OpenStreetMap, se carga solo al abrir)
     + lista de puntos como radios (el control principal y accesible).
   - Si Leaflet o las teselas no cargan, queda solo la lista con
     "Ver en Google Maps" por punto; la selección sigue funcionando.
   - MapaRecojo.miniatura(caja, seleccion): mapa estático liviano (teselas OSM),
     sin cargar Leaflet.
   seleccion = { puntoId, fecha: "AAAA-MM-DD", hora: "HH:MM" }
   Necesita puntos-recojo.js (PUNTOS) y app.js (MALHU.anticipacionMinutos).
   ============================================================ */

const MapaRecojo = (function () {
  const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quieto = () => reducir || document.documentElement.classList.contains("quieto");
  const LEAFLET_CSS = { href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", sri: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" };
  const LEAFLET_JS = { src: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", sri: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" };
  const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>';

  /* ---------- Utilidades de horario ---------- */
  const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const aHHMM = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  /** "13:30" → "1:30 p. m." */
  function horaLegible(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    const sufijo = h < 12 ? "a. m." : "p. m.";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
  }
  const textoVentanas = (p) => (p.ventanas && p.ventanas.length
    // Hora fija por turno (inicio = fin) → "Mañana 7:00 a. m."; si fuera un rango, "inicio – fin"
    ? p.ventanas.map((v) => (v.inicio === v.fin
      ? `${v.nombre || ""} ${horaLegible(v.inicio)}`.trim()
      : `${horaLegible(v.inicio)} – ${horaLegible(v.fin)}`)).join(" · ")
    : "Horario por confirmar");
  function hoyISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function fechaLegible(iso) {
    if (!iso) return "";
    if (iso === hoyISO()) return "Hoy";
    try { return new Date(iso + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" }); }
    catch (e) { return iso; }
  }
  /** Horas cada 15 min dentro de cada ventana; para hoy, marca las que ya pasaron (+ anticipación). */
  function horasDe(punto, fecha) {
    const ant = typeof MALHU !== "undefined" && typeof MALHU.anticipacionMinutos === "number" ? MALHU.anticipacionMinutos : 0;
    const ahora = new Date();
    const limite = fecha === hoyISO() ? ahora.getHours() * 60 + ahora.getMinutes() + ant : -1;
    return (punto.ventanas || []).map((v) => {
      const horas = [];
      for (let t = aMin(v.inicio); t <= aMin(v.fin); t += 15) horas.push({ valor: aHHMM(t), pasada: t < limite });
      return { nombre: v.nombre, horas };
    });
  }
  const conCoordenadas = (p) => typeof p.lat === "number" && typeof p.lng === "number";
  const enlaceMapa = (p) => conCoordenadas(p)
    ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.nombre + " Huancayo")}`;
  const porId = (id) => PUNTOS.find((p) => p.id === id) || null;

  /* ---------- Miniatura estática (teselas OSM, sin Leaflet) ---------- */
  function lonLatAPx(lng, lat, z) {
    const n = 256 * Math.pow(2, z);
    const r = (lat * Math.PI) / 180;
    return { x: ((lng + 180) / 360) * n, y: ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n };
  }
  function miniatura(caja, seleccion) {
    const ancho = caja.clientWidth || 320;
    const alto = caja.clientHeight || 200;
    const p = seleccion && porId(seleccion.puntoId);
    const conocidos = PUNTOS.filter(conCoordenadas);
    const foco = p && conCoordenadas(p) ? p : null;
    const z = foco ? 15 : 13;
    const centro = foco
      ? { lat: foco.lat, lng: foco.lng }
      : { lat: conocidos.reduce((s, x) => s + x.lat, 0) / conocidos.length, lng: conocidos.reduce((s, x) => s + x.lng, 0) / conocidos.length };
    const c = lonLatAPx(centro.lng, centro.lat, z);
    const x0 = c.x - ancho / 2, y0 = c.y - alto / 2;
    const capa = document.createElement("div");
    capa.className = "mini-teselas";
    capa.setAttribute("aria-hidden", "true");
    let fallos = 0, total = 0;
    for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + ancho) / 256); tx++) {
      for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + alto) / 256); ty++) {
        const img = document.createElement("img");
        img.alt = "";
        img.width = 256;
        img.height = 256;
        img.decoding = "async";
        img.loading = "lazy";
        img.style.transform = `translate(${Math.round(tx * 256 - x0)}px, ${Math.round(ty * 256 - y0)}px)`;
        img.addEventListener("error", () => { img.remove(); if (++fallos === total) caja.classList.add("sin-teselas"); }, { once: true });
        img.src = `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`;
        total++;
        capa.append(img);
      }
    }
    conocidos.forEach((q) => {
      const m = lonLatAPx(q.lng, q.lat, z);
      const x = m.x - x0, y = m.y - y0;
      if (x < 0 || y < 0 || x > ancho || y > alto) return;
      const pin = document.createElement("span");
      pin.className = "pin" + (p && q.id === p.id ? " activo" : "");
      pin.textContent = q.letra;
      pin.style.transform = `translate(${Math.round(x - 16)}px, ${Math.round(y - 16)}px)`;
      capa.append(pin);
    });
    const atrib = document.createElement("span");
    atrib.className = "mini-atribucion";
    atrib.textContent = "© OpenStreetMap";
    caja.replaceChildren(capa, atrib);
  }

  /* ---------- Carga diferida de Leaflet ---------- */
  let promesaLeaflet = null;
  function cargarLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (promesaLeaflet) return promesaLeaflet;
    promesaLeaflet = new Promise((ok, mal) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = LEAFLET_CSS.href;
      css.integrity = LEAFLET_CSS.sri;
      css.crossOrigin = "";
      document.head.append(css);
      const js = document.createElement("script");
      js.src = LEAFLET_JS.src;
      js.integrity = LEAFLET_JS.sri;
      js.crossOrigin = "";
      const tiempo = setTimeout(() => mal(new Error("Leaflet tardó demasiado")), 10000);
      js.onload = () => { clearTimeout(tiempo); window.L ? ok(window.L) : mal(new Error("Leaflet no disponible")); };
      js.onerror = () => { clearTimeout(tiempo); mal(new Error("Leaflet no cargó")); };
      document.head.append(js);
    });
    promesaLeaflet.catch(() => { promesaLeaflet = null; });
    return promesaLeaflet;
  }

  /* ---------- Diálogo ---------- */
  let dialogo, origen = null, alListo = null, mapa = null, marcadores = new Map();
  let sel = { puntoId: "", fecha: hoyISO(), hora: "" };

  function montar() {
    dialogo = document.createElement("dialog");
    dialogo.className = "mapa-dlg";
    dialogo.inert = true;
    dialogo.setAttribute("role", "dialog");
    dialogo.setAttribute("aria-modal", "true");
    dialogo.setAttribute("aria-labelledby", "mapa-titulo");
    dialogo.innerHTML = `
      <div class="mapa-cabeza">
        <h2 id="mapa-titulo" tabindex="-1">Elige tu punto de recojo</h2>
        <button class="btn btn-redondo" type="button" data-mapa-cerrar aria-label="Cerrar mapa">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div class="mapa-cuerpo">
        <div class="mapa-lado">
          <div class="mapa-lienzo" id="mapa-lienzo" aria-label="Mapa de puntos de recojo"></div>
          <p class="mapa-aviso" data-mapa-aviso hidden>No se pudo cargar el mapa. Elige tu punto en la lista; cada uno tiene su enlace a Google Maps.</p>
        </div>
        <div class="mapa-panel">
          <fieldset class="mapa-puntos">
            <legend>Punto de recojo</legend>
            <div class="mapa-lista" data-mapa-lista></div>
          </fieldset>
          <div class="mapa-hora" data-mapa-hora hidden>
            <p class="mapa-ventana"><strong>Horas de recojo:</strong> <span data-mapa-ventana></span></p>
            <p class="mapa-nota">Las horas de recojo cambian según el punto.</p>
            <div class="mapa-campos">
              <div>
                <label class="campo-etq" for="mapa-fecha">Fecha de recojo</label>
                <input class="campo" type="date" id="mapa-fecha">
              </div>
              <div>
                <label class="campo-etq" for="mapa-hora-sel">Elige tu hora</label>
                <select class="campo" id="mapa-hora-sel" aria-describedby="mapa-hora-ayuda"></select>
              </div>
            </div>
            <p class="mapa-nota" id="mapa-hora-ayuda" data-mapa-ayuda></p>
          </div>
          <button class="btn btn-primario mapa-listo" type="button" data-mapa-listo>Listo</button>
        </div>
      </div>
      <p class="sr" aria-live="polite" data-mapa-anuncio></p>`;
    document.body.append(dialogo);

    const $ = (s) => dialogo.querySelector(s);
    const lista = $("[data-mapa-lista]");
    PUNTOS.forEach((p) => {
      const sinHorario = !p.ventanas || !p.ventanas.length;
      const fila = document.createElement("div");
      fila.className = "mapa-opcion" + (sinHorario ? " deshabilitada" : "");
      const id = "punto-" + p.id;
      fila.innerHTML = `
        <input type="radio" name="punto-recojo" id="${id}" value="${p.id}" ${sinHorario ? "disabled" : ""} aria-describedby="${id}-info">
        <label for="${id}">
          <span class="mapa-letra" aria-hidden="true">${p.letra}</span>
          <span class="mapa-opcion-texto">
            <span class="mapa-opcion-nombre"></span>
            <span class="mapa-opcion-info" id="${id}-info"></span>
          </span>
        </label>
        <a class="mapa-gmaps" target="_blank" rel="noopener" hidden></a>`;
      fila.querySelector(".mapa-opcion-nombre").textContent = `${p.letra}. ${p.nombre}`;
      fila.querySelector(".mapa-opcion-info").textContent = [p.direccion, p.referencia, sinHorario ? "Horario por confirmar" : textoVentanas(p)].filter(Boolean).join(" · ");
      const gm = fila.querySelector(".mapa-gmaps");
      gm.href = enlaceMapa(p);
      gm.textContent = "Ver en Google Maps";
      gm.setAttribute("aria-label", `Ver ${p.nombre} en Google Maps (se abre en otra pestaña)`);
      fila.querySelector("input").addEventListener("change", () => elegirPunto(p.id, "lista"));
      lista.append(fila);
    });

    const fecha = $("#mapa-fecha");
    fecha.min = hoyISO();
    fecha.addEventListener("change", () => {
      sel.fecha = fecha.value && fecha.value >= hoyISO() ? fecha.value : hoyISO();
      fecha.value = sel.fecha;
      pintarHoras();
    });
    $("#mapa-hora-sel").addEventListener("change", (e) => { sel.hora = e.target.value; });

    $("[data-mapa-listo]").addEventListener("click", () => {
      if (alListo) alListo(Object.assign({}, sel));
      cerrar();
    });
    dialogo.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(); });
    dialogo.addEventListener("click", (e) => {
      if (e.target === dialogo || e.target.closest("[data-mapa-cerrar]")) cerrar();
    });
    dialogo.addEventListener("close", () => {
      dialogo.inert = true;
      if (typeof Carrito !== "undefined") Carrito.bloquearFondo();
      if (origen && origen.isConnected) origen.focus();
    });
  }

  const anunciar = (t) => { const a = dialogo.querySelector("[data-mapa-anuncio]"); a.textContent = ""; setTimeout(() => (a.textContent = t), 60); };

  function elegirPunto(id, desde) {
    const p = porId(id);
    if (!p || !p.ventanas || !p.ventanas.length) return;
    const cambio = sel.puntoId !== id;
    sel.puntoId = id;
    if (cambio) sel.hora = ""; // cambiar de punto reinicia la hora
    const radio = dialogo.querySelector(`#punto-${id}`);
    if (radio && !radio.checked) radio.checked = true;
    dialogo.querySelectorAll(".mapa-opcion").forEach((f) => f.classList.toggle("activa", f.querySelector("input").value === id));
    marcadores.forEach((m, mid) => { const e = m.getElement(); if (e) e.classList.toggle("activo", mid === id); });
    if (mapa && conCoordenadas(p)) mapa.panTo([p.lat, p.lng], { animate: !quieto() });
    dialogo.querySelector("[data-mapa-hora]").hidden = false;
    dialogo.querySelector("[data-mapa-ventana]").textContent = textoVentanas(p);
    pintarHoras();
    if (desde === "mapa") anunciar(`Elegiste ${p.letra}, ${p.nombre}. Hora de recojo: ${textoVentanas(p)}.`);
  }

  function pintarHoras() {
    const p = porId(sel.puntoId);
    const select = dialogo.querySelector("#mapa-hora-sel");
    select.replaceChildren();
    const vacia = new Option("Elige una hora", "");
    select.append(vacia);
    if (!p) return;
    let disponibles = 0;
    horasDe(p, sel.fecha).forEach((g) => {
      const grupo = document.createElement("optgroup");
      grupo.label = g.nombre;
      g.horas.forEach((h) => {
        const etiqueta = g.horas.length === 1 ? `${g.nombre} · ${horaLegible(h.valor)}` : horaLegible(h.valor);
        const o = new Option(etiqueta + (h.pasada ? " (ya pasó)" : ""), h.valor);
        o.disabled = h.pasada;
        if (!h.pasada) disponibles++;
        grupo.append(o);
      });
      select.append(grupo);
    });
    // Si la hora elegida ya no es válida (cambió la fecha), se reinicia
    const valida = [...select.options].some((o) => o.value === sel.hora && !o.disabled);
    if (!valida) sel.hora = "";
    select.value = sel.hora;
    dialogo.querySelector("[data-mapa-ayuda]").textContent = disponibles
      ? "Una hora fija por turno: mañana, tarde o noche."
      : "Ya no quedan horas para esta fecha. Elige otro día.";
  }

  async function iniciarMapa() {
    const lienzo = dialogo.querySelector("#mapa-lienzo");
    const aviso = dialogo.querySelector("[data-mapa-aviso]");
    const sinMapa = () => {
      lienzo.hidden = true;
      aviso.hidden = false;
      dialogo.querySelectorAll(".mapa-gmaps").forEach((a) => (a.hidden = false));
    };
    try {
      const L = await cargarLeaflet();
      if (mapa) { mapa.invalidateSize(); return; }
      const conocidos = PUNTOS.filter(conCoordenadas);
      mapa = L.map(lienzo, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });
      mapa.attributionControl.setPrefix("");
      let cargadas = 0, fallidas = 0;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: ATRIBUCION })
        .on("tileload", () => cargadas++)
        .on("tileerror", () => { if (++fallidas >= 4 && cargadas === 0) sinMapa(); })
        .addTo(mapa);
      mapa.fitBounds(L.latLngBounds(conocidos.map((p) => [p.lat, p.lng])), { padding: [36, 36] });
      conocidos.forEach((p) => {
        const sinHorario = !p.ventanas || !p.ventanas.length;
        const m = L.marker([p.lat, p.lng], {
          keyboard: true,
          title: `${p.letra}. ${p.nombre}`,
          icon: L.divIcon({ className: "marcador" + (sinHorario ? " deshabilitado" : ""), html: `<span>${p.letra}</span>`, iconSize: [40, 40], iconAnchor: [20, 20] }),
        }).addTo(mapa);
        const e = m.getElement();
        if (e) {
          e.setAttribute("role", "button");
          e.setAttribute("aria-label", `Punto ${p.letra}: ${p.nombre}${sinHorario ? ", horario por confirmar" : ""}`);
          e.removeAttribute("title");
          // Enter o Espacio sobre el marcador = elegir ese punto (igual que en la lista)
          e.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); ev.stopPropagation(); elegirPunto(p.id, "mapa"); }
          });
        }
        m.on("click", () => elegirPunto(p.id, "mapa"));
        marcadores.set(p.id, m);
      });
      if (sel.puntoId) elegirPunto(sel.puntoId);
    } catch (err) {
      sinMapa();
    }
  }

  function abrir({ seleccion, origen: o, alListo: f } = {}) {
    if (!dialogo) montar();
    origen = o || document.activeElement;
    alListo = f || null;
    sel = Object.assign({ puntoId: "", fecha: hoyISO(), hora: "" }, seleccion || {});
    if (!sel.fecha || sel.fecha < hoyISO()) sel.fecha = hoyISO();
    dialogo.querySelector("#mapa-fecha").value = sel.fecha;
    dialogo.querySelectorAll('input[name="punto-recojo"]').forEach((r) => (r.checked = r.value === sel.puntoId));
    const horaPrevia = sel.hora;
    if (sel.puntoId) { elegirPunto(sel.puntoId); sel.hora = horaPrevia; pintarHoras(); }
    else dialogo.querySelector("[data-mapa-hora]").hidden = true;
    dialogo.inert = false;
    dialogo.showModal();
    if (typeof Carrito !== "undefined") Carrito.bloquearFondo();
    if (!quieto()) dialogo.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 400, easing: EASE });
    const marcado = dialogo.querySelector('input[name="punto-recojo"]:checked') || dialogo.querySelector('input[name="punto-recojo"]:not(:disabled)');
    if (marcado) marcado.focus();
    iniciarMapa();
  }
  function cerrar() {
    if (!dialogo || !dialogo.open) return;
    if (quieto()) { dialogo.close(); return; }
    const a = dialogo.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.98)" }], { duration: 180, easing: EASE });
    a.onfinish = () => dialogo.close();
  }

  return { abrir, cerrar, miniatura, horaLegible, fechaLegible, textoVentanas, enlaceMapa, porId, hoyISO, conCoordenadas };
})();
