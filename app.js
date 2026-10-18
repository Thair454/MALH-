/* ============================================================
   app.js · Malhú · comportamiento compartido de las páginas del cliente
   - Configuración de WhatsApp (objeto MALHU)
   - Enlaces [data-wa] con mensaje ya redactado
   - Cabecera con fondo al bajar
   - Botón "Pausar animaciones" (se recuerda entre páginas)
   - Titulares con máscara que suben al entrar en pantalla (.revela)
   ============================================================ */

/* CONFIGURACIÓN: tu número con código de país, sin + ni espacios */
const MALHU = {
  whatsapp: "51906517929",
  mensajeGeneral: "Hola Malhú, quiero hacer un pedido.",
  /* Datos de contacto que se muestran como información (catering.html).
     Los que estén vacíos no se muestran. No se inventa ninguno. */
  contacto: {
    whatsapp: "+51 906 517 929",
    telefono: ["906 517 929", "935 123 782", "928 455 832"], // uno o varios
    correo: "",     // COMPLETAR, ej. "hola@malhu.pe"
    instagram: "https://www.instagram.com/malhuoficial/",
    facebook: "https://www.facebook.com/profile.php?id=61590606636356",
    tiktok: "",     // COMPLETAR: URL completa
    zona: "",       // COMPLETAR, ej. "Distritos de ..."
    horario: "",    // COMPLETAR, ej. "Lunes a sábado, 8:00 a 20:00"
  },

  /* Métodos de pago (confirmar-pedido.html). Un método sin sus datos aparece deshabilitado. */
  pagos: {
    yapePlin: {
      activo: true,
      numero: "906517929",
      titular: "",        // COMPLETAR: nombre del titular, tal como aparece en Yape/Plin
      qrYape: "",         // COMPLETAR: ej. "assets/img/qr-yape.png"
      qrPlin: "",         // COMPLETAR: ej. "assets/img/qr-plin.png"
    },
    efectivo: { activo: false }, // "Efectivo al recoger": desactivado por defecto
  },
  /* Tarjeta: proveedor elegido Culqi. Necesita llave pública + un servidor que cree el cargo
     con la llave secreta (la secreta NUNCA va en el navegador). Mientras sea false: "Próximamente". */
  tarjetaActiva: false,
  tarjeta: { proveedor: "culqi", llavePublica: "", endpointCargo: "" }, // COMPLETAR: llave pública de Culqi y URL del servidor que crea el cargo
  /* Correo de confirmación: necesita un servidor o servicio (ver pedido.js). */
  correo: { activo: false, endpoint: "" },
  /* Minutos mínimos entre "ahora" y la hora de recojo de hoy. null = sin anticipación extra. */
  anticipacionMinutos: null, // COMPLETAR si Malhú necesita un margen (ej. 30)
};

/** Enlace de WhatsApp con el mensaje ya escrito. */
function enlaceWhatsApp(texto) {
  return `https://wa.me/${MALHU.whatsapp}?text=${encodeURIComponent(texto || MALHU.mensajeGeneral)}`;
}

/** Precio en soles con el formato peruano (S/ 1,250.00), o "Consultar" si no hay precio. */
const FORMATO_PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
function formatoSoles(precio) {
  return typeof precio === "number" && isFinite(precio) ? FORMATO_PEN.format(precio) : "Consultar";
}

(function () {
  const html = document.documentElement;
  html.classList.add("js");
  try { if (localStorage.getItem("malhu-pausa") === "1") html.classList.add("quieto"); } catch (e) {}

  document.addEventListener("DOMContentLoaded", () => {
    const $ = (s) => document.querySelector(s);

    // WhatsApp
    document.querySelectorAll("[data-wa]").forEach((a) => (a.href = enlaceWhatsApp(a.dataset.wa)));
    const anio = $("#anio");
    if (anio) anio.textContent = new Date().getFullYear();

    // Cabecera
    const cab = $("#cabecera");
    if (cab) {
      const alScroll = () => cab.classList.toggle("solida", scrollY > 40);
      addEventListener("scroll", alScroll, { passive: true });
      alScroll();
    }

    // Pausar animaciones
    const boton = $("#pausa");
    if (boton) {
      const pintar = () => {
        const p = html.classList.contains("quieto");
        boton.setAttribute("aria-pressed", String(p));
        const txt = $("#pausa-txt");
        if (txt) txt.textContent = p ? "Reanudar animaciones" : "Pausar animaciones";
      };
      boton.addEventListener("click", () => {
        html.classList.toggle("quieto");
        try { localStorage.setItem("malhu-pausa", html.classList.contains("quieto") ? "1" : "0"); } catch (e) {}
        pintar();
        document.dispatchEvent(new CustomEvent("malhu:pausa"));
      });
      pintar();
    }

    // Fondo dinámico: la luz del cursor sigue al mouse con inercia
    const luz = document.querySelector(".orbe-cursor");
    if (luz && matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let mx = innerWidth / 2, my = innerHeight * 0.4, x = mx, y = my, raf = 0;
      const paso = () => {
        x += (mx - x) * 0.06;
        y += (my - y) * 0.06;
        luz.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        raf = Math.abs(mx - x) + Math.abs(my - y) > 0.5 ? requestAnimationFrame(paso) : 0;
      };
      addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse" || html.classList.contains("quieto")) return;
        mx = e.clientX;
        my = e.clientY;
        if (!raf) raf = requestAnimationFrame(paso);
      }, { passive: true });
    }

    // Titulares con máscara: suben cuando la sección entra en pantalla
    const bloques = document.querySelectorAll(".revela");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -15% 0px" });
      bloques.forEach((b) => io.observe(b));
    } else {
      bloques.forEach((b) => b.classList.add("visto"));
    }
  });
})();
