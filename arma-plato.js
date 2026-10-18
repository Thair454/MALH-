/* ============================================================
   arma-plato.js · Malhú · constructor "Arma tu plato" y resumen
   - Lee los ingredientes de Firestore (firebase.js); si no se pueden leer, usa
     CATEGORIAS e INGREDIENTES de ingredientes.js (+ lo que el dueño
     agregó en plato-personalizado-admin.html, guardado en "db_config_pers").
   - Guarda el plato en curso en localStorage ("malhu-pedido").
   - "Agregar a mi plan" usa PlanHoy (plan.js); "Agregar al carrito" usa Carrito (carrito.js);
     "Pedir por WhatsApp" usa enlaceWhatsApp() (app.js).
   ============================================================ */

/* Ingredientes de Firestore (firebase.js). Firestore manda en nombre, categoría, porción,
   precio y máximo; la nutrición se toma del ingrediente de ingredientes.js con el mismo
   nombre, escalada a la porción de Firestore. Sin coincidencia: sin datos ("—"). */
async function ingredientesDeFirestore() {
  if (!window.MalhuDB) return null;
  let remotos;
  try { remotos = await MalhuDB.ingredientes(); }
  catch (e) { console.error("No se pudieron leer los ingredientes de Firestore:", e); return null; }
  if (!remotos.length) return null;

  const vacias = new Set(["de", "con", "y", "en"]);
  const palabras = (t) => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w && !vacias.has(w));
  const parecido = (a, b) => {
    const x = new Set(palabras(a)), y = new Set(palabras(b));
    const c = [...x].filter((w) => y.has(w)).length;
    return c / (x.size + y.size - c || 1);
  };
  const gramosDe = (porcion) => { const m = String(porcion).match(/([\d.]+)\s*g\b/g); return m ? parseFloat(m[m.length - 1]) : null; };
  const unidadesDe = (porcion) => { const m = String(porcion).match(/^([\d.]+)\s*unidad/); return m ? parseFloat(m[1]) : null; };

  const lista = remotos.map((r) => {
    let local = null, mejor = 0.5;
    INGREDIENTES.forEach((i) => { const s = parecido(r.nombre, i.nombre); if (s >= mejor) { mejor = s; local = i; } });
    // Factor para pasar la nutrición local a la porción de Firestore
    let factor = null;
    if (local && r.gramos && gramosDe(local.porcion)) factor = r.gramos / gramosDe(local.porcion);
    else if (local && !r.gramos && unidadesDe(local.porcion) && parseFloat(r.porcion)) factor = parseFloat(r.porcion) / unidadesDe(local.porcion);
    const escalar = (v) => (factor && typeof v === "number" ? Math.round(v * factor * 10) / 10 : null);
    const i = ingrediente({
      id: r.id, categoria: r.categoria, nombre: r.nombre, porcion: r.porcion, precio: r.precio,
      descripcion: local ? local.descripcion : "", emoji: local ? local.emoji : "",
      // Nutrición guardada por el propietario; si no hay, la de ingredientes.js escalada
      kcal: r.kcal ?? escalar(local && local.kcal), proteina: r.proteina ?? escalar(local && local.proteina),
      carbo: r.carbo ?? escalar(local && local.carbo), grasa: r.grasa ?? escalar(local && local.grasa),
      vitaminas: factor && local ? local.vitaminas : [],
    });
    i.foto = local ? local.foto : ""; // sin foto propia: ficha con emoji (no se pide un archivo que no existe)
    i.maximo = r.maximo;
    return i;
  });
  const categorias = MalhuDB.CATEGORIAS.filter((c) => lista.some((i) => i.categoria === c.id));
  return { ingredientes: lista, categorias };
}

document.addEventListener("DOMContentLoaded", async () => {
  const $ = (s, r = document) => r.querySelector(s);
  const esNumero = (v) => typeof v === "number" && isFinite(v);
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quieto = () => reducir || document.documentElement.classList.contains("quieto");
  const MAX_CANTIDAD = 9;
  const CLAVE = "malhu-pedido";
  const fmt = (n, dec = 0) => n.toLocaleString("es-PE", { maximumFractionDigits: dec, minimumFractionDigits: 0 });
  const el = (tag, clase, texto) => {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  };

  /* ---------- Datos: Firestore, o ingredientes.js + panel del dueño ----------
     Con Firestore el precio del plato es la suma de cada ingrediente × porciones (sin precio base). */
  const remoto = await ingredientesDeFirestore();
  const desdeFirestore = !!remoto;
  const CATEGORIAS_PLATO = desdeFirestore ? remoto.categorias : CATEGORIAS;
  const ingredientes = desdeFirestore ? remoto.ingredientes : INGREDIENTES.slice();
  if (!desdeFirestore) try {
    const admin = JSON.parse(localStorage.getItem("db_config_pers"));
    const yaEsta = (n) => ingredientes.some((i) => i.nombre.toLowerCase() === String(n).trim().toLowerCase());
    const slug = (t) => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
    [["bases", "base"], ["proteinas", "proteinas"]].forEach(([campo, cat]) => {
      ((admin && admin[campo]) || []).forEach((n) => {
        if (!String(n).trim() || yaEsta(n)) return;
        ingredientes.push(ingrediente({ id: `admin-${cat}-${slug(n)}`, categoria: cat, nombre: String(n).trim() }));
      });
    });
  } catch (e) {}
  const porId = new Map(ingredientes.map((i) => [i.id, i]));
  // Máximo de porciones: el de Firestore ("maximo_por_porcion") o MAX_CANTIDAD
  const maxDe = (id) => Math.min(MAX_CANTIDAD, (porId.get(id) && porId.get(id).maximo) || MAX_CANTIDAD);

  /* Precio del plato armado: el "precio base" del panel del dueño (db_config_pers.precioBase);
     si el dueño aún no lo guardó, PRECIO_BASE_PLATO de ingredientes.js. Con Firestore: 0. */
  const precioBase = (() => {
    if (desdeFirestore) return 0;
    try {
      const n = parseFloat((JSON.parse(localStorage.getItem("db_config_pers")) || {}).precioBase);
      if (esNumero(n) && n >= 0) return n;
    } catch (e) {}
    return PRECIO_BASE_PLATO;
  })();

  if (desdeFirestore) $("#costo-base").previousElementSibling.textContent = "Ingredientes";

  /* ---------- Estado: { id: cantidad } ---------- */
  const plato = new Map();
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE));
    ((g && g.items) || []).forEach((x) => { if (porId.has(x.id) && x.cantidad > 0) plato.set(x.id, Math.min(maxDe(x.id), x.cantidad)); });
  } catch (e) {}

  function guardar() {
    // Estructura compartible: cada ítem lleva sus datos, así otra página (plato-menu) puede leerla sin ingredientes.js
    const items = [...plato].map(([id, cantidad]) => {
      const i = porId.get(id);
      return { id, origen: "ingrediente", nombre: i.nombre, porcion: i.porcion, cantidad, precio: i.precio, kcal: i.kcal, proteina: i.proteina, carbo: i.carbo, grasa: i.grasa };
    });
    const t = totales();
    try {
      localStorage.setItem(CLAVE, JSON.stringify({
        version: 1,
        tipo: "plato-personalizado",
        items,
        totales: { precio: t.precio, precioBase: t.base, extras: t.extras, kcal: t.kcal, proteina: t.proteina, carbo: t.carbo, grasa: t.grasa },
        actualizado: new Date().toISOString(),
      }));
    } catch (e) {}
  }

  /** Precio = base + extras (ingrediente sin precio = incluido). Nutrición: suma solo lo conocido. */
  function totales() {
    const t = { precio: 0, base: 0, extras: 0, kcal: 0, proteina: 0, carbo: 0, grasa: 0, unidades: 0, sinDatos: 0, vitaminas: new Set() };
    plato.forEach((n, id) => {
      const i = porId.get(id);
      t.unidades += n;
      if (esNumero(i.precio)) t.extras += i.precio * n;
      let falta = false;
      ["kcal", "proteina", "carbo", "grasa"].forEach((k) => { if (esNumero(i[k])) t[k] += i[k] * n; else falta = true; });
      if (falta) t.sinDatos++;
      (i.vitaminas || []).forEach((v) => t.vitaminas.add(v));
    });
    t.base = plato.size ? precioBase : 0;
    t.precio = t.base + t.extras;
    return t;
  }

  /* ---------- 1) Categorías (patrón ARIA tabs) ---------- */
  const tabs = $("#categorias");
  const panel = $("#panel-ingredientes");
  const listaIng = $("#ingredientes");
  const vertical = matchMedia("(min-width: 1100px)");
  let categoria = CATEGORIAS_PLATO[0].id;

  const botonesCat = CATEGORIAS_PLATO.map((c, i) => {
    const b = el("button", "cat");
    b.type = "button";
    b.id = "tab-" + c.id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", "panel-ingredientes");
    b.dataset.cat = c.id;
    b.append(el("span", "cat-nombre", c.nombre), el("span", "cat-cuenta dato"));
    b.addEventListener("click", () => elegirCategoria(c.id));
    tabs.append(b);
    return b;
  });
  tabs.setAttribute("aria-orientation", vertical.matches ? "vertical" : "horizontal");
  vertical.addEventListener("change", () => tabs.setAttribute("aria-orientation", vertical.matches ? "vertical" : "horizontal"));
  // Flechas, Inicio y Fin mueven entre categorías (sin animar: el teclado cambia al instante)
  tabs.addEventListener("keydown", (e) => {
    const i = botonesCat.indexOf(document.activeElement);
    if (i < 0) return;
    const n = botonesCat.length;
    const mapa = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: n - 1 };
    if (!(e.key in mapa)) return;
    e.preventDefault();
    const j = (mapa[e.key] + n) % n;
    botonesCat[j].focus();
    elegirCategoria(CATEGORIAS_PLATO[j].id, true);
  });

  function pintarCategorias() {
    botonesCat.forEach((b) => {
      const c = CATEGORIAS_PLATO.find((x) => x.id === b.dataset.cat);
      const elegidos = [...plato].reduce((s, [id, n]) => s + (porId.get(id).categoria === c.id ? n : 0), 0);
      const activa = c.id === categoria;
      b.setAttribute("aria-selected", String(activa));
      b.tabIndex = activa ? 0 : -1;
      const cuenta = b.querySelector(".cat-cuenta");
      cuenta.textContent = elegidos;
      cuenta.classList.toggle("con", elegidos > 0);
      cuenta.setAttribute("aria-label", elegidos === 1 ? "1 elegido" : `${elegidos} elegidos`);
    });
  }

  function elegirCategoria(id, porTeclado = false) {
    if (id === categoria && listaIng.children.length) return;
    categoria = id;
    const c = CATEGORIAS_PLATO.find((x) => x.id === id);
    panel.setAttribute("aria-labelledby", "tab-" + id);
    $("#lista-titulo").textContent = c.nombre;
    pintarCategorias();
    const filas = ingredientes.filter((i) => i.categoria === id).map(filaIngrediente);
    listaIng.replaceChildren(...filas);
    // Cascada corta al cambiar con el mouse; con teclado, al instante
    if (!quieto() && !porTeclado) {
      filas.forEach((f, k) => f.animate(
        [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
        { duration: 600, delay: Math.min(k, 6) * 60, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "backwards" }
      ));
    }
  }

  /* ---------- 2) Filas de ingredientes ---------- */
  const filasPorId = new Map();
  const icoMenos = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>';
  const icoMas = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

  // Foto del ingrediente o, si falta o no carga, ficha con su emoji (visual.js)
  function ficha(i, clase) {
    const caja = el("span", clase);
    caja.setAttribute("aria-hidden", "true");
    caja.append(Visual.imagen(Object.assign({ tipo: "ingrediente" }, i), "miniatura", { alt: "" }));
    return caja;
  }

  function filaIngrediente(i) {
    const li = el("li", "ing");
    li.dataset.id = i.id;
    const texto = el("div", "ing-texto");
    const nombre = el("h4", "ing-nombre", i.nombre);
    texto.append(nombre);
    if (i.descripcion) texto.append(el("p", "ing-desc", i.descripcion));
    const datos = el("ul", "ing-datos");
    datos.setAttribute("aria-label", "Datos por porción");
    datos.append(
      el("li", "chip chip-porcion dato", i.porcion || "—"),
      el("li", "chip dato", `${esNumero(i.kcal) ? fmt(i.kcal) : "—"} kcal`),
      el("li", "chip dato", `${esNumero(i.proteina) ? fmt(i.proteina, 1) : "—"} g proteína`)
    );
    texto.append(datos);

    const lado = el("div", "ing-lado");
    lado.append(el("p", "ing-precio dato" + (esNumero(i.precio) ? "" : " sin-precio"), esNumero(i.precio) ? `${desdeFirestore ? "" : "+ "}${formatoSoles(i.precio)}` : "Incluido"));

    const control = el("div", "ing-control");
    const anadir = el("button", "btn btn-primario ing-anadir");
    anadir.type = "button";
    anadir.innerHTML = icoMas + '<span aria-hidden="true">Añadir</span>';
    anadir.setAttribute("aria-label", `Añadir ${i.nombre}`);
    const paso = el("div", "ing-paso");
    paso.setAttribute("role", "group");
    paso.setAttribute("aria-label", `Cantidad de ${i.nombre}`);
    const menos = el("button", "paso-btn");
    menos.type = "button";
    menos.innerHTML = icoMenos;
    menos.setAttribute("aria-label", `Quitar una porción de ${i.nombre}`);
    const cant = el("span", "paso-n dato");
    const mas = el("button", "paso-btn");
    mas.type = "button";
    mas.innerHTML = icoMas;
    mas.setAttribute("aria-label", `Añadir otra porción de ${i.nombre}`);
    paso.append(menos, cant, mas);
    control.append(anadir, paso);
    lado.append(control);

    anadir.addEventListener("click", () => { cambiar(i.id, +1); mas.focus(); });
    mas.addEventListener("click", () => cambiar(i.id, +1));
    menos.addEventListener("click", () => {
      const quedan = cambiar(i.id, -1);
      if (quedan === 0) anadir.focus(); // el paso se oculta: el foco pasa a "Añadir"
    });

    li.append(ficha(i, "ing-ficha"), texto, lado);
    filasPorId.set(i.id, { li, anadir, paso, cant, mas, menos });
    pintarFila(i.id);
    return li;
  }

  function pintarFila(id) {
    const f = filasPorId.get(id);
    if (!f) return;
    const n = plato.get(id) || 0;
    f.anadir.hidden = n > 0;
    f.paso.hidden = n === 0;
    f.cant.textContent = n;
    f.mas.disabled = n >= maxDe(id);
    f.li.classList.toggle("ing-elegido", n > 0);
  }

  /** Cambia la cantidad, actualiza en el lugar y devuelve la nueva cantidad. */
  function cambiar(id, delta) {
    const n = Math.max(0, Math.min(maxDe(id), (plato.get(id) || 0) + delta));
    if (n === 0) plato.delete(id); else plato.set(id, n);
    guardar();
    pintarFila(id);
    pintarCategorias();
    pintarResumen();
    const t = totales();
    anunciar(`${porId.get(id).nombre}, ${n}. Total ${formatoSoles(t.precio)}. ${fmt(t.kcal)} kcal.`);
    return n;
  }

  /* ---------- 3) Resumen "Tu plato" ---------- */
  const kcalNum = $("#kcal-num");
  const elegidos = $("#elegidos");
  let kcalMostrado = 0;
  let animKcal = 0;

  function contarKcal(objetivo) {
    cancelAnimationFrame(animKcal);
    const desde = kcalMostrado;
    kcalMostrado = objetivo;
    if (quieto() || desde === objetivo) { kcalNum.textContent = fmt(objetivo); return; }
    const t0 = performance.now();
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / 600);
      const e = 1 - Math.pow(1 - p, 4);
      kcalNum.textContent = fmt(Math.round(desde + (objetivo - desde) * e));
      if (p < 1) animKcal = requestAnimationFrame(paso);
    };
    animKcal = requestAnimationFrame(paso);
  }

  function listaVitaminas(set) {
    const v = ["A", "C", "D", "E", "K", "B6", "B9", "B12"].filter((x) => set.has(x));
    if (!v.length) return "";
    const unir = v.length === 1 ? v[0] : `${v.slice(0, -1).join(", ")} y ${v[v.length - 1]}`;
    return `${v.length === 1 ? "Vitamina" : "Vitaminas"} ${unir}`;
  }

  function filaElegido(id, n) {
    const i = porId.get(id);
    const li = el("li", "elegido");
    li.dataset.id = id;
    const texto = el("div", "elegido-texto");
    texto.append(el("p", "elegido-nombre", i.nombre));
    texto.append(el("p", "elegido-datos dato", `${n} × ${i.porcion || "porción"} · ${esNumero(i.kcal) ? fmt(i.kcal * n) + " kcal" : "— kcal"}`));
    const quitar = el("button", "elegido-quitar");
    quitar.type = "button";
    quitar.setAttribute("aria-label", `Quitar ${i.nombre} de tu plato`);
    quitar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    quitar.addEventListener("click", () => {
      const sig = li.nextElementSibling || li.previousElementSibling;
      const sigId = sig && sig.dataset.id;
      cambiar(id, -MAX_CANTIDAD);
      // El foco va al siguiente "Quitar" o, si el plato quedó vacío, al título del resumen
      const destino = sigId && elegidos.querySelector(`[data-id="${sigId}"] .elegido-quitar`);
      (destino || $("#t-plato")).focus();
    });
    li.append(texto, el("span", "elegido-n dato", "×" + n), quitar);
    return li;
  }

  function pintarResumen() {
    const t = totales();
    contarKcal(Math.round(t.kcal));
    $("#m-proteina").textContent = fmt(t.proteina, 1) + " g";
    $("#m-carbo").textContent = fmt(t.carbo, 1) + " g";
    $("#m-grasa").textContent = fmt(t.grasa, 1) + " g";
    const vit = listaVitaminas(t.vitaminas);
    $("#vitaminas").textContent = vit || (plato.size ? "Sin vitaminas destacadas" : "Vitaminas: —");

    // Lista de elegidos: se actualiza en el lugar (las filas existentes se reutilizan)
    const actuales = new Map([...elegidos.children].map((li) => [li.dataset.id, li]));
    const enFoco = elegidos.contains(document.activeElement) ? document.activeElement.closest("li") : null;
    [...plato].forEach(([id, n], k) => {
      let li = actuales.get(id);
      if (li && li !== enFoco) { li.replaceWith(filaElegido(id, n)); li = elegidos.querySelector(`[data-id="${id}"]`); }
      else if (li === enFoco) { li.querySelector(".elegido-n").textContent = "×" + n; }
      else { li = filaElegido(id, n); elegidos.append(li); }
      actuales.delete(id);
      if (elegidos.children[k] !== li) elegidos.insertBefore(li, elegidos.children[k] || null);
    });
    actuales.forEach((li) => li.remove());

    $("#plato-vacio").hidden = plato.size > 0;
    // Costo: precio del plato armado + extras (con Firestore: solo la suma de ingredientes)
    $("#costo-base").textContent = formatoSoles(desdeFirestore ? t.extras : precioBase);
    $("#fila-extras").hidden = desdeFirestore || t.extras === 0;
    $("#costo-extras").textContent = `+ ${formatoSoles(t.extras)}`;
    $("#precio-total").textContent = formatoSoles(t.precio);

    const notas = [];
    if (t.sinDatos) notas.push(t.sinDatos === 1 ? "1 ingrediente no tiene datos nutricionales: no se suma." : `${t.sinDatos} ingredientes no tienen datos nutricionales: no se suman.`);
    const aviso = $("#aviso-datos");
    aviso.textContent = notas.join(" ");
    aviso.hidden = !notas.length;

    document.querySelectorAll("[data-requiere-plato]").forEach((b) => b.setAttribute("aria-disabled", String(!plato.size)));

    // Barra inferior (tablet y móvil)
    $("#barra-plato-items").textContent = t.unidades === 1 ? "1 porción" : `${t.unidades} porciones`;
    $("#barra-plato-kcal").textContent = `${fmt(Math.round(t.kcal))} kcal`;
    $("#barra-plato-precio").textContent = formatoSoles(t.precio);
  }

  const anuncio = $("#anuncio-plato");
  let tAnuncio;
  function anunciar(texto) {
    clearTimeout(tAnuncio);
    tAnuncio = setTimeout(() => (anuncio.textContent = texto), 350);
  }
  const avisoVisible = $("#aviso-plato");
  let tAviso;
  function avisar(texto) {
    avisoVisible.textContent = texto;
    avisoVisible.classList.add("visible");
    clearTimeout(tAviso);
    tAviso = setTimeout(() => avisoVisible.classList.remove("visible"), 2600);
  }

  /* ---------- Acciones ---------- */
  const nombrePlato = () => {
    const nombres = [...plato].map(([id, n]) => porId.get(id).nombre + (n > 1 ? ` ×${n}` : ""));
    return "Plato armado: " + nombres.join(", ");
  };
  const comidaDelPlato = () => {
    const t = totales();
    return { nombre: nombrePlato(), kcal: t.kcal, proteina: t.proteina, carbo: t.carbo, grasa: t.grasa, incompleto: t.sinDatos > 0 };
  };
  const vacio = () => {
    if (plato.size) return false;
    avisar("Primero elige al menos un ingrediente.");
    return true;
  };

  $("#a-mi-plan").addEventListener("click", (e) => {
    if (vacio()) return;
    PlanHoy.agregar(comidaDelPlato());
    avisar("Agregado a tu plan de hoy.");
  });

  $("#al-carrito").addEventListener("click", () => {
    if (vacio()) return;
    const t = totales();
    // Mismo plato = mismo id: el carrito suma cantidad en vez de duplicar
    const firma = [...plato].sort().map(([id, n]) => `${id}:${n}`).join("|");
    Carrito.agregar({
      id: "armado-" + firma,
      tipo: "personalizado",
      nombre: nombrePlato(),
      precio: t.precio,
      foto: "Slide Shows/Portada/Personaliza.jpg",
      alt: "Plato armado con los ingredientes que elegiste",
      ingredientes: [...plato].map(([id, n]) => {
        const i = porId.get(id);
        return { nombre: i.nombre, cantidad: n, porcion: i.porcion, emoji: i.emoji || Visual.emojiDe(i) };
      }),
      nutricion: { kcal: t.kcal, proteina: t.proteina, carbo: t.carbo, grasa: t.grasa, vitaminas: [...t.vitaminas], parcial: t.sinDatos > 0 },
    });
  });

  /* ---------- Revisión antes de WhatsApp ---------- */
  const revision = $("#revision");
  let origenRevision = null;
  revision.inert = true;

  $("#por-whatsapp").addEventListener("click", (e) => {
    if (vacio()) return;
    origenRevision = e.currentTarget;
    const t = totales();
    const lista = $("#revision-lista");
    lista.replaceChildren(...[...plato].map(([id, n]) => {
      const i = porId.get(id);
      const li = el("li");
      li.append(el("span", "", `${i.nombre} (${i.porcion || "porción"})`), el("span", "dato", `×${n}`));
      return li;
    }));
    $("#revision-total").textContent = formatoSoles(t.precio);
    $("#revision-desglose").textContent = desdeFirestore ? "Suma de los ingredientes elegidos" : t.extras ?`Plato armado ${formatoSoles(t.base)} + extras ${formatoSoles(t.extras)}` : `Plato armado ${formatoSoles(t.base)}`;
    $("#revision-kcal").textContent = `${fmt(Math.round(t.kcal))} kcal aprox.${t.sinDatos ? " (sin contar ingredientes sin datos)" : ""}`;
    $("#revision-plan").checked = true;
    revision.inert = false;
    revision.showModal();
    if (!quieto()) revision.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 600, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  });
  const cerrarRevision = () => revision.close();
  revision.addEventListener("close", () => {
    revision.inert = true;
    if (origenRevision) origenRevision.focus();
  });
  revision.addEventListener("click", (e) => { if (e.target === revision || e.target.closest("[data-cerrar-revision]")) cerrarRevision(); });

  $("#revision-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const t = totales();
    const nombre = $("#revision-nombre").value.trim();
    const notas = $("#revision-notas").value.trim();
    const lineas = ["Hola Malhú, quiero pedir este plato armado:"];
    plato.forEach((n, id) => {
      const i = porId.get(id);
      lineas.push(`• ${i.nombre} (${i.porcion || "porción"}) × ${n}`);
    });
    lineas.push("");
    if (t.extras && !desdeFirestore) lineas.push(`Plato armado: ${formatoSoles(t.base)} · Extras: ${formatoSoles(t.extras)}`);
    lineas.push(`Total: ${formatoSoles(t.precio)}`);
    lineas.push(`Calorías aprox.: ${fmt(Math.round(t.kcal))} kcal`);
    if (nombre) lineas.push(`Nombre: ${nombre}`);
    if (notas) lineas.push(`Notas: ${notas}`);
    if ($("#revision-plan").checked) PlanHoy.agregar(comidaDelPlato());
    window.open(enlaceWhatsApp(lineas.join("\n")), "_blank", "noopener");
    cerrarRevision();
  });

  /* ---------- Panel inferior (tablet y móvil) ---------- */
  const hoja = $("#hoja");
  const cuerpoHoja = $("#hoja-cuerpo");
  const lugarResumen = $("#lugar-resumen");
  const resumen = $("#resumen");
  const abrirHoja = $("#abrir-hoja");
  hoja.inert = true;

  abrirHoja.addEventListener("click", () => {
    cuerpoHoja.append(resumen); // el mismo contenido, movido (no duplicado)
    hoja.inert = false;
    hoja.showModal(); // modal: atrapa el foco; Escape lo cierra
    abrirHoja.setAttribute("aria-expanded", "true");
    if (!quieto()) hoja.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 600, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  });
  function cerrarHoja() {
    if (!hoja.open) return;
    if (quieto()) { hoja.close(); return; }
    const a = hoja.animate([{ transform: "none" }, { transform: "translateY(100%)" }], { duration: 180, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
    a.onfinish = () => hoja.close();
  }
  hoja.addEventListener("cancel", (e) => { e.preventDefault(); cerrarHoja(); });
  hoja.addEventListener("click", (e) => { if (e.target === hoja || e.target.closest("[data-cerrar-hoja]")) cerrarHoja(); });
  hoja.addEventListener("close", () => {
    hoja.inert = true;
    lugarResumen.append(resumen);
    abrirHoja.setAttribute("aria-expanded", "false");
    if (!vertical.matches) abrirHoja.focus();
  });
  vertical.addEventListener("change", () => { if (vertical.matches && hoja.open) hoja.close(); });

  // Otra pestaña cambió el plato
  addEventListener("storage", (e) => {
    if (e.key !== CLAVE) return;
    plato.clear();
    try { (JSON.parse(e.newValue).items || []).forEach((x) => { if (porId.has(x.id)) plato.set(x.id, x.cantidad); }); } catch (er) {}
    filasPorId.forEach((_, id) => pintarFila(id));
    pintarCategorias();
    pintarResumen();
  });

  // Estado inicial
  elegirCategoria(categoria, true);
  pintarResumen();
});
