/* ============================================================
   visual.js · Malhú · fotos con relleno elegante (compartido)
   Visual.imagen(item, tamaño) → elemento listo para insertar:
     - la foto real si item.foto existe y carga;
     - si no hay foto, o no carga (evento error), una ficha de relleno:
       degradado bosque → carbón, aro azafrán y el emoji del ítem (decorativa).
   tamaño: "miniatura" (1:1), "tarjeta" (4:3) o "grande" (4:3).
   El emoji es relleno temporal: cuando la foto con el nombre esperado existe,
   aparece sola (no hay que tocar el código).
   ============================================================ */

const Visual = (function () {
  /* Emoji por palabra clave del nombre o la categoría (el primero que coincide gana) */
  const REGLAS = [
    [/postre|torta|keke|helado|mazamorra|arroz con leche|alfajor|brownie/i, "🍰"],
    [/bebida|jugo|limonada|chicha|refresco|caf[eé]|infusi[oó]n/i, "🥤"],
    [/sopa|guiso|caldo|crema de|chupe|lentej|estofado/i, "🍲"],
    [/ensalad/i, "🥗"],
    [/pollo|pechuga|gallina/i, "🍗"],
    [/pescad|salm[oó]n|at[uú]n|cevich|bonito|trucha|merluza/i, "🐟"],
    [/carne|\bres\b|lomo|bistec|cerdo|chancho/i, "🥩"],
    [/arroz|quinua|quinoa/i, "🍚"],
    [/pasta|fideo|tallar[ií]n|spaghetti|lasa[ñn]a/i, "🍝"],
  ];
  const POR_DEFECTO = "🍽️";
  const CATERING = { reunion: "☕", celebracion: "🎂", grande: "🥂" };
  const CATEGORIAS = { base: "🍚", proteinas: "🍗", verduras: "🥦", complementos: "🥑", postres: "🍰" };

  /* Fotos que ya fallaron en esta visita: no se vuelven a pedir (sin parpadeo ni errores repetidos) */
  const fallidas = new Set();
  try { JSON.parse(sessionStorage.getItem("malhu-fotos-fallidas") || "[]").forEach((u) => fallidas.add(u)); } catch (e) {}
  const marcarFallida = (u) => {
    fallidas.add(u);
    try { sessionStorage.setItem("malhu-fotos-fallidas", JSON.stringify([...fallidas])); } catch (e) {}
  };

  /** Emoji del ítem: el suyo, o el que corresponde a su tipo/categoría/nombre. */
  function emojiDe(item) {
    if (!item) return POR_DEFECTO;
    if (item.emoji) return item.emoji;
    if (item.tipo === "catering") {
      const c = item.catering || {};
      if (CATERING[c.tipoId]) return CATERING[c.tipoId];
      const ev = String(c.evento || item.nombre || "");
      if (/grande/i.test(ev)) return CATERING.grande;
      if (/celebr/i.test(ev)) return CATERING.celebracion;
      return CATERING.reunion;
    }
    if (item.tipo === "personalizado" && Array.isArray(item.ingredientes) && item.ingredientes.length) {
      const unicos = [...new Set(item.ingredientes.map((i) => emojiDe(i)))];
      return unicos.slice(0, 3).join("");
    }
    if (CATEGORIAS[item.categoria]) {
      const porNombre = REGLAS.find(([re]) => re.test(item.nombre || ""));
      return porNombre ? porNombre[1] : CATEGORIAS[item.categoria];
    }
    const texto = `${item.nombre || ""} ${item.categoria || ""}`;
    const r = REGLAS.find(([re]) => re.test(texto));
    return r ? r[1] : POR_DEFECTO;
  }

  function ficha(item) {
    const f = document.createElement("span");
    f.className = "relleno";
    f.setAttribute("aria-hidden", "true");
    const e = document.createElement("span");
    e.className = "relleno-emoji";
    const emojis = emojiDe(item);
    e.textContent = emojis;
    if ([...emojis].length > 2) e.classList.add("varios"); // 2 o 3 emojis: un poco más chicos
    f.append(e);
    return f;
  }

  /**
   * @param {object} item  {foto, alt, emoji, nombre, ...}
   * @param {"miniatura"|"tarjeta"|"grande"} tamano
   * @param {{alt?: string}} opciones  alt "" cuando el nombre ya está escrito al lado
   */
  function imagen(item, tamano = "tarjeta", opciones = {}) {
    const caja = document.createElement("span");
    caja.className = `visual visual-${tamano}`;
    const foto = item && item.foto;
    if (!foto || fallidas.has(foto)) {
      caja.append(ficha(item));
      return caja;
    }
    const img = document.createElement("img");
    img.decoding = "async";
    img.loading = "lazy";
    const lado = tamano === "miniatura" ? 120 : tamano === "grande" ? 1200 : 600;
    img.width = lado;
    img.height = tamano === "miniatura" ? lado : Math.round(lado * 0.75);
    img.alt = opciones.alt != null ? opciones.alt : (item.alt || "");
    img.addEventListener("error", () => {
      marcarFallida(foto);
      img.replaceWith(ficha(item)); // nunca un ícono de imagen rota
    }, { once: true });
    img.src = foto;
    caja.append(img);
    return caja;
  }

  return { imagen, emojiDe, ficha };
})();
