/* ============================================================
   catering.js · Malhú · lógica de catering.html
   Lee TIPOS, GALERIA y OFRECE de catering-datos.js, y MALHU.contacto de app.js.
   Agrega al carrito con Carrito.agregar() (carrito.js).
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s) => document.querySelector(s);
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esNumero = (v) => typeof v === "number" && isFinite(v);
  const el = (tag, clase, texto) => {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  };

  let tipo = TIPOS[0];
  let personas = tipo.personasMin;
  const maxDe = (t) => (esNumero(t.personasMax) ? t.personasMax : PERSONAS_TOPE);
  const rangoTexto = (t) => (esNumero(t.personasMax) ? `${t.personasMin} a ${t.personasMax} personas` : `${t.personasMin} personas o más`);
  const precioTexto = (t) => (esNumero(t.precioPorPersona) ? `desde ${formatoSoles(t.precioPorPersona)} por persona` : "Precio por persona por confirmar");
  const costo = () => (esNumero(tipo.precioPorPersona) ? personas * tipo.precioPorPersona : null);

  /* ---------- 1) Tipo de evento: radios reales ---------- */
  const grupo = $("#tipos");
  TIPOS.forEach((t, i) => {
    const etiqueta = el("label", "tipo");
    const radio = el("input");
    radio.type = "radio";
    radio.name = "tipo-evento";
    radio.value = t.id;
    radio.className = "sr";
    radio.checked = i === 0;
    radio.addEventListener("change", () => elegir(t));

    const foto = el("span", "tipo-foto");
    const img = el("img");
    img.src = t.foto;
    img.alt = ""; // decorativa aquí: la descripción completa está en "Nuestro trabajo"
    img.width = 600;
    img.height = 400;
    img.decoding = "async";
    if (i > 0) img.loading = "lazy";
    foto.append(img);

    const texto = el("span", "tipo-texto");
    texto.append(el("span", "tipo-nombre", t.nombre), el("span", "tipo-rango dato", rangoTexto(t)), el("span", "tipo-precio", precioTexto(t)));
    const marca = el("span", "tipo-marca");
    marca.setAttribute("aria-hidden", "true");
    marca.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

    etiqueta.append(radio, foto, texto, marca);
    grupo.append(etiqueta);
  });

  /* ---------- 2) Tu catering: personas, fecha y costo estimado ---------- */
  const campo = $("#personas");
  const menos = $("#menos");
  const mas = $("#mas");
  const fecha = $("#fecha");
  const costoEl = $("#costo");
  const anuncio = $("#costo-anuncio");
  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  fecha.min = hoy;

  let valorMostrado = null;
  let animacion = 0;
  let tAnuncio;

  function pintarCosto() {
    const objetivo = costo();
    cancelAnimationFrame(animacion);
    if (!esNumero(objetivo)) {
      costoEl.textContent = "Por confirmar";
      costoEl.classList.add("sin-precio");
      valorMostrado = null;
    } else {
      costoEl.classList.remove("sin-precio");
      const desde = esNumero(valorMostrado) ? valorMostrado : 0;
      if (reducir || document.documentElement.classList.contains("quieto") || desde === objetivo) {
        costoEl.textContent = formatoSoles(objetivo);
      } else {
        // Cuenta hacia el nuevo valor (solo cambia el texto)
        const t0 = performance.now();
        const dur = 600;
        const paso = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          const e = 1 - Math.pow(1 - p, 4);
          costoEl.textContent = formatoSoles(desde + (objetivo - desde) * e);
          if (p < 1) animacion = requestAnimationFrame(paso);
        };
        animacion = requestAnimationFrame(paso);
      }
      valorMostrado = objetivo;
    }
    // Anuncio educado, cuando el usuario deja de cambiar
    clearTimeout(tAnuncio);
    tAnuncio = setTimeout(() => {
      anuncio.textContent = `${tipo.nombre}, ${personas} personas: costo estimado ${esNumero(objetivo) ? formatoSoles(objetivo) : "por confirmar"}.`;
    }, 500);
  }

  function fijarPersonas(n) {
    const min = tipo.personasMin, max = maxDe(tipo);
    personas = Math.min(max, Math.max(min, Number.isFinite(n) ? Math.round(n) : min));
    campo.value = personas;
    menos.disabled = personas <= min;
    mas.disabled = personas >= max;
    pintarCosto();
  }

  function elegir(t) {
    tipo = t;
    campo.min = t.personasMin;
    campo.max = maxDe(t);
    $("#rango-texto").textContent = `Para ${rangoTexto(t)}.`;
    $("#precio-persona").textContent = esNumero(t.precioPorPersona) ? `${formatoSoles(t.precioPorPersona)} por persona` : "Precio por persona por confirmar";
    // Si las personas quedan fuera del nuevo rango, se ajustan
    fijarPersonas(personas < t.personasMin || personas > maxDe(t) ? t.personasMin : personas);
    mostrarFoto(GALERIA.findIndex((g) => g.tipo === t.id && g.foto === t.foto));
  }

  menos.addEventListener("click", () => fijarPersonas(personas - 1));
  mas.addEventListener("click", () => fijarPersonas(personas + 1));
  // Mientras se escribe no se corrige; al salir del campo se ajusta al rango
  campo.addEventListener("input", () => {
    const n = parseInt(campo.value, 10);
    if (n >= tipo.personasMin && n <= maxDe(tipo)) { personas = n; menos.disabled = n <= tipo.personasMin; mas.disabled = n >= maxDe(tipo); pintarCosto(); }
  });
  campo.addEventListener("change", () => fijarPersonas(parseInt(campo.value, 10)));

  $("#agregar-catering").addEventListener("click", () => {
    fijarPersonas(parseInt(campo.value, 10));
    Carrito.agregar({
      tipo: "catering",
      tipoId: tipo.id,
      evento: tipo.nombre,
      personas,
      personasMin: tipo.personasMin,
      personasMax: maxDe(tipo),
      precioPorPersona: tipo.precioPorPersona,
      fecha: fecha.value || "",
      costoEstimado: costo(),
      foto: tipo.foto,
      alt: tipo.alt,
      emoji: tipo.emoji,
      descripcion: tipo.descripcion,
      incluye: tipo.incluye || [],
      estimado: true,
    });
  });

  /* ---------- 3) Nuestro trabajo: foto grande con fundido + miniaturas ---------- */
  const capas = [$("#foto-a"), $("#foto-b")];
  let capaVisible = 0;
  let fotoActual = -1;
  const pie = $("#foto-pie");
  const miniaturas = $("#miniaturas");

  GALERIA.forEach((g, i) => {
    const b = el("button", "miniatura");
    b.type = "button";
    b.setAttribute("aria-label", `Ver foto: ${g.pie}`);
    const img = el("img");
    img.src = g.foto;
    img.alt = g.alt;
    img.width = 300;
    img.height = 300;
    img.decoding = "async";
    img.loading = "lazy";
    b.append(img);
    b.addEventListener("click", () => mostrarFoto(i));
    miniaturas.append(b);
  });

  function mostrarFoto(i) {
    if (i < 0 || i === fotoActual) return;
    fotoActual = i;
    const g = GALERIA[i];
    const siguiente = capas[1 - capaVisible];
    const actual = capas[capaVisible];
    const cambiar = () => {
      siguiente.classList.add("visible");
      actual.classList.remove("visible");
      capaVisible = 1 - capaVisible;
    };
    siguiente.alt = g.alt;
    siguiente.src = g.foto;
    pie.textContent = g.pie;
    [...miniaturas.children].forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    // Espera a que la foto esté lista para que el fundido no parpadee
    if (siguiente.decode) siguiente.decode().then(cambiar, cambiar);
    else cambiar();
  }

  /* ---------- 4) ¿Qué ofrecemos? ---------- */
  const ICONOS = {
    bocadito: '<circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/>',
    taza: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3"/>',
    plato: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
    evento: '<path d="M4 9h16v11H4zM4 9l2-5h12l2 5M9 13h6"/>',
    reloj: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    mesa: '<path d="M3 9h18M5 9v10M19 9v10M8 9V6h8v3"/>',
  };
  const ofrece = $("#ofrece-lista");
  OFRECE.forEach((o) => {
    const li = el("li", "ofrece-item");
    const ico = el("span", "ofrece-ico");
    ico.setAttribute("aria-hidden", "true");
    ico.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONOS[o.icono] || ICONOS.plato}</svg>`;
    li.append(ico, el("span", "", o.titulo));
    ofrece.append(li);
  });

  /* ---------- 5) Contactos (solo información; los vacíos no se muestran) ---------- */
  const c = (typeof MALHU !== "undefined" && MALHU.contacto) || {}; // const de app.js: no está en window
  const telefonos = [].concat(c.telefono || []).filter(Boolean);
  const datos = [
    { etiqueta: "WhatsApp", valor: c.whatsapp, href: c.whatsapp ? `https://wa.me/${String(c.whatsapp).replace(/\D/g, "")}` : "" },
    { etiqueta: telefonos.length > 1 ? "Teléfonos" : "Teléfono", valor: telefonos.join(" · "),
      lista: telefonos.map((t) => ({ valor: t, href: `tel:+51${String(t).replace(/\D/g, "").replace(/^51(?=\d{9}$)/, "")}` })) },
    { etiqueta: "Correo", valor: c.correo, href: c.correo ? `mailto:${c.correo}` : "" },
    { etiqueta: "Instagram", valor: c.instagram ? "Instagram" : "", href: c.instagram },
    { etiqueta: "Facebook", valor: c.facebook ? "Facebook" : "", href: c.facebook },
    { etiqueta: "TikTok", valor: c.tiktok ? "TikTok" : "", href: c.tiktok },
    { etiqueta: "Zona de atención", valor: c.zona },
    { etiqueta: "Horario", valor: c.horario },
  ].filter((d) => d.valor);
  const contactos = $("#contactos-lista");
  if (!datos.length) {
    $("#contactos-vacio").hidden = false;
  } else {
    datos.forEach((d) => {
      const fila = el("div", "contacto");
      const dt = el("dt", "dato", d.etiqueta);
      const dd = el("dd");
      if (d.lista) {
        const ul = el("ul", "contacto-lista");
        d.lista.forEach((x) => {
          const a = el("a", "", x.valor);
          a.href = x.href;
          const li = el("li");
          li.append(a);
          ul.append(li);
        });
        dd.append(ul);
      } else if (d.href) {
        const a = el("a", "", d.valor);
        a.href = d.href;
        if (/^https?:/.test(d.href)) { a.target = "_blank"; a.rel = "noopener"; }
        dd.append(a);
      } else dd.textContent = d.valor;
      fila.append(dt, dd);
      contactos.append(fila);
    });
  }

  // Estado inicial
  elegir(TIPOS[0]);
});
