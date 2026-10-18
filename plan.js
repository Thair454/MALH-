/* ============================================================
   plan.js · Malhú · "Mi plan de hoy" y sugerencias
   - Metas de calorías y proteína (editables, se recuerdan).
   - Comidas registradas hoy: se guardan por fecha y el plan empieza vacío cada día.
   - Sugerencias: platos de platos.js con datos nutricionales completos.
   Expone window.PlanHoy = { agregar(comida), comidas(), alCambiar(fn) }
   Necesita app.js (formatoSoles) y platos.js (PLATOS).
   ============================================================ */

const PlanHoy = (function () {
  const CLAVE_PLAN = "malhu-plan";        // { fecha: "AAAA-MM-DD", comidas: [...] }
  const CLAVE_METAS = "malhu-plan-metas"; // { kcal, proteina }
  const METAS = {
    kcal: { inicial: 2000, min: 1200, max: 4000, paso: 50 },
    proteina: { inicial: 90, min: 30, max: 250, paso: 5 },
  };
  const esNumero = (v) => typeof v === "number" && isFinite(v);
  const hoy = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const leerJSON = (clave) => {
    try { return JSON.parse(localStorage.getItem(clave)); } catch (e) { return null; }
  };
  const guardarJSON = (clave, valor) => {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {}
  };
  const limitar = (n, m) => Math.min(m.max, Math.max(m.min, Math.round(n / m.paso) * m.paso));

  /* ---------- Estado ---------- */
  let metas = (() => {
    const g = leerJSON(CLAVE_METAS) || {};
    return {
      kcal: esNumero(g.kcal) ? limitar(g.kcal, METAS.kcal) : METAS.kcal.inicial,
      proteina: esNumero(g.proteina) ? limitar(g.proteina, METAS.proteina) : METAS.proteina.inicial,
    };
  })();
  let comidas = (() => {
    const g = leerJSON(CLAVE_PLAN);
    return g && g.fecha === hoy() && Array.isArray(g.comidas) ? g.comidas : []; // otro día: empieza vacío
  })();
  const avisos = new Set();
  const guardarPlan = () => {
    guardarJSON(CLAVE_PLAN, { fecha: hoy(), comidas });
    avisos.forEach((f) => f(comidas));
  };

  /** Suma lo que se sabe; cuenta las comidas a las que les falta el dato. */
  function totales() {
    const t = { kcal: 0, proteina: 0, carbo: 0, grasa: 0, incompletas: 0 };
    comidas.forEach((c) => {
      ["kcal", "proteina", "carbo", "grasa"].forEach((k) => { if (esNumero(c[k])) t[k] += c[k]; });
      if (c.incompleto || !esNumero(c.kcal) || !esNumero(c.proteina)) t.incompletas++;
    });
    return t;
  }

  /* ---------- Interfaz ---------- */
  function montar() {
    const $ = (s) => document.querySelector(s);
    const raiz = $("#plan");
    if (!raiz) return;
    const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const campoKcal = $("#meta-kcal");
    const campoProt = $("#meta-proteina");
    const lista = $("#comidas");
    const vacio = $("#comidas-vacio");
    const nota = $("#plan-incompletas");
    const sugerencias = $("#sugerencias");
    const sugVacio = $("#sugerencias-vacio");
    const fmt = (n, dec = 0) => n.toLocaleString("es-PE", { maximumFractionDigits: dec });

    // Metas: se corrigen al salir del campo (no mientras se escribe)
    [[campoKcal, "kcal"], [campoProt, "proteina"]].forEach(([campo, k]) => {
      campo.min = METAS[k].min;
      campo.max = METAS[k].max;
      campo.step = METAS[k].paso;
      campo.value = metas[k];
      campo.addEventListener("change", () => {
        const n = parseFloat(campo.value);
        metas[k] = esNumero(n) ? limitar(n, METAS[k]) : METAS[k].inicial;
        campo.value = metas[k];
        guardarJSON(CLAVE_METAS, metas);
        pintar();
      });
    });

    function barra(id, valor, meta, unidad) {
      const el = document.getElementById(id);
      const relleno = el.querySelector(".barra-relleno");
      const p = meta > 0 ? Math.min(1, valor / meta) : 0;
      el.setAttribute("aria-valuemax", String(meta));
      el.setAttribute("aria-valuenow", String(Math.round(Math.min(valor, meta))));
      el.setAttribute("aria-valuetext", `${fmt(valor)} de ${fmt(meta)} ${unidad}`);
      relleno.style.transform = `scaleX(${p})`;
      el.classList.toggle("completa", valor >= meta);
      document.getElementById(id + "-texto").textContent = `${fmt(valor)} / ${fmt(meta)} ${unidad}`;
    }

    function filaComida(c) {
      const li = document.createElement("li");
      li.className = "comida";
      li.dataset.id = c.id;
      const texto = document.createElement("div");
      const nombre = document.createElement("p");
      nombre.className = "comida-nombre";
      nombre.textContent = c.nombre;
      const datos = document.createElement("p");
      datos.className = "comida-datos dato";
      const partes = [
        esNumero(c.kcal) ? `${fmt(c.kcal)} kcal` : "— kcal",
        `P ${esNumero(c.proteina) ? fmt(c.proteina, 1) : "—"} g`,
        `C ${esNumero(c.carbo) ? fmt(c.carbo, 1) : "—"} g`,
        `G ${esNumero(c.grasa) ? fmt(c.grasa, 1) : "—"} g`,
      ];
      datos.textContent = partes.join(" · ") + (c.incompleto ? " · datos incompletos" : "");
      texto.append(nombre, datos);
      const quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "comida-quitar";
      quitar.setAttribute("aria-label", `Quitar ${c.nombre} de mi plan`);
      quitar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      quitar.addEventListener("click", () => {
        // El foco pasa a la comida siguiente (o a la anterior, o a la meta) para no perderse
        const k = comidas.findIndex((x) => x.id === c.id);
        comidas = comidas.filter((x) => x.id !== c.id);
        guardarPlan(); // la lista se vuelve a pintar
        const botones = lista.querySelectorAll(".comida-quitar");
        const destino = botones[Math.min(k, botones.length - 1)];
        (destino || campoKcal).focus();
        anunciar(`${c.nombre} quitado de tu plan.`);
      });
      li.append(texto, quitar);
      return li;
    }

    function pintar() {
      const t = totales();
      // Lista: se reconstruye solo si cambió (no hay foco dentro de filas nuevas)
      lista.replaceChildren(...comidas.map(filaComida));
      vacio.hidden = comidas.length > 0;
      barra("barra-kcal", t.kcal, metas.kcal, "kcal");
      barra("barra-proteina", t.proteina, metas.proteina, "g de proteína");
      nota.hidden = t.incompletas === 0;
      nota.textContent = t.incompletas === 1
        ? "Una comida tiene datos incompletos: solo se suma lo que se conoce."
        : `${t.incompletas} comidas tienen datos incompletos: solo se suma lo que se conoce.`;
      pintarSugerencias(t);
    }

    /* ---------- Sugerencias ---------- */
    function pintarSugerencias(t) {
      const faltaKcal = Math.max(0, metas.kcal - t.kcal);
      const faltaProt = Math.max(0, metas.proteina - t.proteina);
      const completos = (typeof PLATOS !== "undefined" ? PLATOS : []).filter((p) =>
        ["kcal", "proteina", "carbohidratos", "grasa"].every((k) => esNumero(p[k]))
      );
      sugerencias.replaceChildren();
      if (!completos.length) {
        sugVacio.textContent = "Aún no hay platos con datos nutricionales completos para sugerirte. Pronto los verás aquí.";
        sugVacio.hidden = false;
        return;
      }
      if (faltaKcal === 0 && faltaProt === 0) {
        sugVacio.textContent = "Ya llegaste a tus metas de hoy.";
        sugVacio.hidden = false;
        return;
      }
      sugVacio.hidden = true;
      // Puntaje: cuánto cubre de la proteína que falta, sin pasarse de las calorías que quedan
      const puntaje = (p) => {
        const cubreProt = faltaProt > 0 ? Math.min(p.proteina, faltaProt) / faltaProt : 0;
        const exceso = Math.max(0, p.kcal - faltaKcal) / Math.max(faltaKcal, 300);
        const usoKcal = faltaKcal > 0 ? Math.min(p.kcal, faltaKcal) / faltaKcal : 0;
        return cubreProt * 2 + usoKcal - exceso * 2;
      };
      completos.sort((a, b) => puntaje(b) - puntaje(a)).slice(0, 3).forEach((p) => {
        const li = document.createElement("li");
        li.className = "sugerencia";
        const motivo = faltaProt >= 10
          ? `Te faltan ${fmt(faltaProt)} g de proteína; este plato aporta ${fmt(p.proteina, 1)} g.`
          : `Te quedan ${fmt(faltaKcal)} kcal; este plato tiene ${fmt(p.kcal)} kcal.`;
        li.innerHTML = `
          <img src="" alt="" width="160" height="120" loading="lazy" decoding="async">
          <div class="sugerencia-texto">
            <h4 class="sugerencia-nombre"></h4>
            <p class="sugerencia-datos dato"></p>
            <p class="sugerencia-motivo"></p>
            <a class="sugerencia-enlace" href="plato-menu.html">Ver en Platos del día</a>
          </div>`;
        const img = li.querySelector("img");
        img.src = p.foto;
        img.alt = p.alt || "";
        li.querySelector(".sugerencia-nombre").textContent = p.nombre;
        li.querySelector(".sugerencia-datos").textContent = `${fmt(p.kcal)} kcal · P ${fmt(p.proteina, 1)} g · ${formatoSoles(p.precio)}`;
        li.querySelector(".sugerencia-motivo").textContent = motivo;
        li.querySelector(".sugerencia-enlace").setAttribute("aria-label", `Ver ${p.nombre} en Platos del día`);
        sugerencias.append(li);
      });
    }

    const anuncio = $("#anuncio-plan");
    let tAnuncio;
    function anunciar(texto) {
      clearTimeout(tAnuncio);
      anuncio.textContent = "";
      tAnuncio = setTimeout(() => (anuncio.textContent = texto), 60);
    }

    avisos.add(pintar);
    // Otra pestaña cambió el plan
    addEventListener("storage", (e) => {
      if (e.key === CLAVE_PLAN) {
        const g = leerJSON(CLAVE_PLAN);
        comidas = g && g.fecha === hoy() && Array.isArray(g.comidas) ? g.comidas : [];
        pintar();
      }
    });
    if (reducir) raiz.classList.add("sin-movimiento");
    pintar();
  }

  document.addEventListener("DOMContentLoaded", montar);

  return {
    /** Registra una comida: { nombre, kcal, proteina, carbo, grasa, incompleto } */
    agregar(c) {
      comidas = comidas.concat({
        id: "c-" + Date.now() + "-" + Math.floor(Math.random() * 1e4),
        nombre: c.nombre,
        kcal: esNumero(c.kcal) ? Math.round(c.kcal) : null,
        proteina: esNumero(c.proteina) ? Math.round(c.proteina * 10) / 10 : null,
        carbo: esNumero(c.carbo) ? Math.round(c.carbo * 10) / 10 : null,
        grasa: esNumero(c.grasa) ? Math.round(c.grasa * 10) / 10 : null,
        incompleto: !!c.incompleto,
        hora: new Date().toTimeString().slice(0, 5),
      });
      guardarPlan();
    },
    comidas: () => comidas.slice(),
    alCambiar: (f) => avisos.add(f),
  };
})();
