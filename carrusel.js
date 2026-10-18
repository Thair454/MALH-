/* ============================================================
   carrusel.js · Malhú · carrusel de platos reutilizable
   Uso:  crearCarrusel(contenedor, listaDePlatos, "Platos del día", { alAgregar(plato), alVerInfo(plato, boton) });
   Necesita: app.js (formatoSoles) y los estilos de styles.css.
   - Tarjeta activa centrada; vecinas atenuadas; resto casi invisible.
   - Arrastre con el dedo o el mouse (con inercia), flechas, puntos,
     clic en una lateral y teclas ← → Inicio Fin. Sin vuelta circular.
   - Solo anima transform y opacity.
   ============================================================ */

function crearCarrusel(contenedor, platos, etiqueta, opciones = {}) {
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const conMouse = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const html = document.documentElement;
  const n = platos.length;
  if (!n) {
    contenedor.innerHTML = '<p class="carrusel-vacio">Pronto publicaremos nuevos platos aquí.</p>';
    return;
  }

  // ---------- Estructura (con createElement: los textos nunca se interpretan como HTML) ----------
  const el = (tag, clase, texto) => {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  };
  const svgFlecha = (d) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

  contenedor.classList.add("carrusel");
  contenedor.setAttribute("role", "region");
  contenedor.setAttribute("aria-roledescription", "carrusel");
  contenedor.setAttribute("aria-label", etiqueta);

  const ventana = el("div", "carrusel-ventana");
  ventana.tabIndex = 0; // para usar el teclado sin tener que enfocar una tarjeta
  ventana.setAttribute("aria-label", `${etiqueta}: usa las flechas del teclado para cambiar de plato`);
  const pista = el("div", "carrusel-pista");
  ventana.append(pista);

  const anterior = el("button", "btn btn-redondo carrusel-flecha carrusel-anterior");
  anterior.type = "button";
  anterior.setAttribute("aria-label", "Plato anterior");
  anterior.innerHTML = svgFlecha("M15 5l-7 7 7 7");
  const siguiente = el("button", "btn btn-redondo carrusel-flecha carrusel-siguiente");
  siguiente.type = "button";
  siguiente.setAttribute("aria-label", "Plato siguiente");
  siguiente.innerHTML = svgFlecha("M9 5l7 7-7 7");

  const puntos = el("div", "carrusel-puntos");
  puntos.setAttribute("role", "group");
  puntos.setAttribute("aria-label", "Elegir plato");
  const anuncio = el("p", "sr");
  anuncio.setAttribute("aria-live", "polite");

  let inicio = Math.floor((n - 1) / 2); // empieza en la tarjeta central
  const tarjetas = platos.map((p, i) => {
    const t = el("article", "tarjeta");
    t.setAttribute("role", "group");
    t.setAttribute("aria-roledescription", "plato");
    t.setAttribute("aria-label", `${i + 1} de ${n}: ${p.nombre}`);

    const marco = el("div", "tarjeta-foto");
    const flota = el("div", "tarjeta-flota");
    if (p.foto) {
      const img = el("img");
      img.src = p.foto;
      img.alt = p.alt || p.nombre;
      img.width = 800;
      img.height = 600;
      img.decoding = "async";
      // Solo las tres visibles al inicio se cargan de inmediato
      img.loading = Math.abs(i - inicio) <= 1 ? "eager" : "lazy";
      img.draggable = false;
      flota.append(img);
    } else {
      const vacio = el("div", "tarjeta-sin-foto");
      vacio.setAttribute("role", "img");
      vacio.setAttribute("aria-label", `${p.nombre} (foto pendiente)`);
      flota.append(vacio);
    }
    marco.append(flota);

    const cuerpo = el("div", "tarjeta-cuerpo");
    cuerpo.append(el("h3", "tarjeta-nombre", p.nombre));
    if (p.descripcion) cuerpo.append(el("p", "tarjeta-desc", p.descripcion));

    const pie = el("div", "tarjeta-pie");
    pie.append(el("p", "tarjeta-precio" + (typeof p.precio === "number" ? "" : " sin-precio"), formatoSoles(p.precio)));
    const chips = [];
    if (typeof p.kcal === "number") chips.push(`${p.kcal} kcal`);
    if (typeof p.proteina === "number") chips.push(`${p.proteina} g proteína`);
    if (chips.length) {
      const ul = el("ul", "tarjeta-chips");
      chips.forEach((c) => ul.append(el("li", "dato", c)));
      pie.append(ul);
    }
    cuerpo.append(pie);

    // Acciones: información nutricional + agregar al carrito
    const acciones = el("div", "tarjeta-acciones");
    const info = el("button", "btn btn-redondo tarjeta-info");
    info.type = "button";
    info.setAttribute("aria-label", `Información nutricional: ${p.nombre}`);
    info.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>';
    info.addEventListener("click", () => opciones.alVerInfo && opciones.alVerInfo(p, info));

    const boton = el("button", "btn btn-primario tarjeta-agregar");
    boton.type = "button";
    boton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/></svg>';
    const texto = el("span", "", "Agregar al carrito");
    boton.append(texto);
    boton.setAttribute("aria-label", `Agregar al carrito: ${p.nombre}`);
    boton.addEventListener("click", () => {
      if (opciones.alAgregar) opciones.alAgregar(p);
      // Confirmación breve en el mismo botón
      boton.classList.add("agregado");
      texto.textContent = "Agregado";
      clearTimeout(boton._t);
      boton._t = setTimeout(() => { boton.classList.remove("agregado"); texto.textContent = "Agregar al carrito"; }, 1400);
    });
    acciones.append(info, boton);
    cuerpo.append(acciones);

    t.append(marco, cuerpo);
    pista.append(t);

    const punto = el("button", "carrusel-punto");
    punto.type = "button";
    punto.setAttribute("aria-label", `Ir a ${p.nombre}, ${i + 1} de ${n}`);
    punto.innerHTML = '<span aria-hidden="true"></span>';
    punto.addEventListener("click", () => ir(i, true));
    puntos.append(punto);
    return t;
  });

  const controles = el("div", "carrusel-controles");
  controles.append(anterior, puntos, siguiente);
  contenedor.append(ventana, controles, anuncio);

  // ---------- Posición ----------
  let actual = -1;
  let desplazamiento = 0;
  const centroDe = (i) => ventana.clientWidth / 2 - (tarjetas[i].offsetLeft + tarjetas[i].offsetWidth / 2);
  const mover = (x, animar) => {
    desplazamiento = x;
    pista.classList.toggle("anima", Boolean(animar) && !reducir);
    pista.style.transform = `translate3d(${x}px, 0, 0)`;
  };
  const masCercana = (x) => {
    let mejor = 0, dist = Infinity;
    tarjetas.forEach((_, i) => {
      const d = Math.abs(centroDe(i) - x);
      if (d < dist) { dist = d; mejor = i; }
    });
    return mejor;
  };

  function pintarEstado(i) {
    tarjetas.forEach((t, k) => {
      const d = Math.abs(k - i);
      t.classList.toggle("activa", d === 0);
      t.classList.toggle("vecina", d === 1);
      if (d === 0) t.removeAttribute("aria-hidden");
      else t.setAttribute("aria-hidden", "true");
      t.querySelectorAll("a, button").forEach((b) => (b.tabIndex = d === 0 ? 0 : -1));
    });
    [...puntos.children].forEach((p, k) => p.setAttribute("aria-current", String(k === i)));
    anterior.setAttribute("aria-disabled", String(i === 0));
    siguiente.setAttribute("aria-disabled", String(i === n - 1));
  }

  function ir(i, anunciar) {
    i = Math.max(0, Math.min(n - 1, i));
    const cambio = i !== actual;
    // si el foco estaba en la tarjeta que deja de estar activa, pasa a la nueva
    const focoEnTarjeta = actual >= 0 && tarjetas[actual].contains(document.activeElement);
    actual = i;
    pintarEstado(i);
    mover(centroDe(i), true);
    if (focoEnTarjeta) tarjetas[i].querySelector(".tarjeta-agregar").focus({ preventScroll: true });
    if (cambio && anunciar) {
      const p = platos[i];
      anuncio.textContent = `${p.nombre}, ${i + 1} de ${n}, ${typeof p.precio === "number" ? formatoSoles(p.precio) : "precio a consultar"}`;
    }
    reiniciarFlote();
  }

  // ---------- Flechas, teclado y clic en laterales ----------
  anterior.addEventListener("click", () => ir(actual - 1, true));
  siguiente.addEventListener("click", () => ir(actual + 1, true));
  contenedor.addEventListener("keydown", (e) => {
    const teclas = { ArrowLeft: actual - 1, ArrowRight: actual + 1, Home: 0, End: n - 1 };
    if (!(e.key in teclas)) return;
    e.preventDefault();
    ir(teclas[e.key], true);
  });

  // ---------- Arrastre con inercia ----------
  let arrastre = null;
  let suprimirClic = false;
  ventana.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    // Los botones de la tarjeta activa no inician arrastre
    if (e.target.closest(".tarjeta.activa button, .tarjeta.activa a")) return;
    arrastre = { desde: actual, x0: e.clientX, base: desplazamiento, ultimoX: e.clientX, ultimoT: performance.now(), v: 0, movido: false, id: e.pointerId };
    pista.classList.remove("anima");
  });
  ventana.addEventListener("pointermove", (e) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const dx = e.clientX - arrastre.x0;
    if (!arrastre.movido && Math.abs(dx) > 6) {
      arrastre.movido = true;
      ventana.setPointerCapture(e.pointerId);
      ventana.classList.add("arrastrando");
    }
    if (!arrastre.movido) return;
    // Resistencia al pasar los extremos
    let x = arrastre.base + dx;
    const min = centroDe(n - 1), max = centroDe(0);
    if (x > max) x = max + (x - max) * 0.35;
    if (x < min) x = min + (x - min) * 0.35;
    mover(x, false);
    const ahora = performance.now();
    arrastre.v = (e.clientX - arrastre.ultimoX) / Math.max(1, ahora - arrastre.ultimoT);
    arrastre.ultimoX = e.clientX;
    arrastre.ultimoT = ahora;
    const cerca = masCercana(x);
    if (cerca !== actual) { actual = cerca; pintarEstado(cerca); }
  });
  const soltar = (e, cancelado) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const a = arrastre;
    arrastre = null;
    ventana.classList.remove("arrastrando");
    if (cancelado) { actual = -1; ir(a.desde, false); return; } // gesto cancelado: vuelve al estado anterior
    if (a.movido) {
      suprimirClic = true;
      // Inercia: proyecta el desplazamiento según la velocidad al soltar
      const i = masCercana(desplazamiento + a.v * 220);
      actual = -1;
      ir(i, i !== a.desde); // solo se anuncia si cambió de plato
    } else {
      // Toque sin arrastre: en una lateral la centra; en la foto de la activa abre su información
      const t = e.target.closest(".tarjeta");
      const k = tarjetas.indexOf(t);
      if (k >= 0 && k !== actual) ir(k, true);
      else if (k === actual && e.target.closest(".tarjeta-foto, .tarjeta-nombre") && opciones.alVerInfo) {
        opciones.alVerInfo(platos[k], t.querySelector(".tarjeta-info"));
      }
    }
  };
  ventana.addEventListener("pointerup", (e) => soltar(e, false));
  ventana.addEventListener("pointercancel", (e) => soltar(e, true));
  ventana.addEventListener("lostpointercapture", (e) => { if (arrastre) soltar(e, true); });
  // Después de arrastrar, el clic que dispara el navegador no debe abrir el enlace
  ventana.addEventListener("click", (e) => {
    if (suprimirClic) { e.preventDefault(); e.stopPropagation(); suprimirClic = false; }
  }, true);

  // ---------- Antigravedad: la foto activa sigue un poco al mouse ----------
  let mx = 0, my = 0, fx = 0, fy = 0, raf = 0;
  const quieto = () => reducir || html.classList.contains("quieto");
  function pasoFlote() {
    fx += (mx - fx) * 0.08;
    fy += (my - fy) * 0.08;
    const f = tarjetas[actual] && tarjetas[actual].querySelector(".tarjeta-flota");
    if (f) f.style.translate = `${fx.toFixed(2)}px ${fy.toFixed(2)}px`;
    raf = Math.abs(mx - fx) + Math.abs(my - fy) > 0.1 ? requestAnimationFrame(pasoFlote) : 0;
  }
  function reiniciarFlote() {
    mx = my = fx = fy = 0;
    tarjetas.forEach((t) => (t.querySelector(".tarjeta-flota").style.translate = ""));
  }
  if (conMouse) {
    ventana.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || arrastre || quieto()) return;
      const r = tarjetas[actual].getBoundingClientRect();
      mx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 14;
      my = ((e.clientY - (r.top + r.height / 2)) / r.height) * 10;
      if (!raf) raf = requestAnimationFrame(pasoFlote);
    });
    ventana.addEventListener("pointerleave", () => { mx = my = 0; if (!raf && !quieto()) raf = requestAnimationFrame(pasoFlote); });
    document.addEventListener("malhu:pausa", reiniciarFlote);
  }

  // ---------- Tamaño ----------
  let espera;
  new ResizeObserver(() => {
    clearTimeout(espera);
    espera = setTimeout(() => mover(centroDe(actual), false), 80);
  }).observe(ventana);

  // Primera posición sin animación
  actual = -1;
  ir(inicio, false);
  mover(centroDe(inicio), false);
  // Cuando cargan las fuentes el ancho puede cambiar
  if (document.fonts) document.fonts.ready.then(() => mover(centroDe(actual), false));

  return { ir: (i) => ir(i, true) };
}
