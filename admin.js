/* ============================================================
   admin.js · Malhú · utilidades compartidas de las páginas del propietario
   - protegerPagina(): sin sesión de Firebase vuelve a principal.html
   - cabecera: correo del propietario y "Cerrar sesión"
   - avisar(), abrirEditor(), el(), FOTOS (imágenes que ya están en el proyecto)
   La seguridad real la dan las reglas de Firestore (firestore.rules): sin
   sesión del propietario, la base de datos rechaza cualquier cambio.
   ============================================================ */

import { MalhuDB } from "./firebase.js";

export { MalhuDB };

const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

/** Crea un elemento con clase y texto (sin innerHTML para datos de la base). */
export function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}

/** Espera la sesión; sin ella redirige a la entrada. Devuelve el usuario. */
export async function protegerPagina() {
  const usuario = await MalhuDB.esperarSesion();
  if (!usuario) {
    location.replace("principal.html?acceso=requerido");
    return new Promise(() => {}); // la página no sigue
  }
  document.documentElement.classList.remove("protegida");
  const u = document.querySelector("[data-usuario]");
  if (u) u.textContent = usuario.email || "";
  document.querySelectorAll("[data-salir]").forEach((b) =>
    b.addEventListener("click", async () => {
      b.disabled = true;
      await MalhuDB.salir();
      location.replace("principal.html");
    })
  );
  // Si la sesión se cierra en otra pestaña, esta también sale
  MalhuDB.alCambiarSesion((x) => { if (!x) location.replace("principal.html?acceso=requerido"); });
  return usuario;
}

/* ---------- Aviso flotante ---------- */
let caja, reloj;
export function avisar(texto, error = false) {
  if (!caja) {
    caja = el("div", "aviso-admin");
    caja.setAttribute("role", "status");
    document.body.append(caja);
  }
  caja.textContent = texto;
  caja.classList.toggle("error", error);
  caja.classList.add("visible");
  clearTimeout(reloj);
  reloj = setTimeout(() => caja.classList.remove("visible"), error ? 6000 : 3200);
}

/** Mensaje entendible para los errores de Firebase más comunes. */
export function mensajeError(e) {
  const c = (e && e.code) || "";
  if (c.includes("permission-denied")) return "La base de datos no permitió el cambio. Revisa que tu usuario sea el del propietario en las reglas de Firestore.";
  if (c.includes("unavailable") || c.includes("network")) return "Sin conexión con la base de datos. Revisa tu internet e inténtalo otra vez.";
  return "No se pudo guardar. " + ((e && e.message) || "");
}

/* ---------- Diálogo editor ---------- */
/** Abre un <dialog class="editor"> con animación y devuelve el foco al cerrarlo. */
export function abrirEditor(dialogo, origen) {
  dialogo.showModal();
  if (!reducir) dialogo.animate([{ opacity: 0, transform: "translateY(16px) scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 400, easing: EASE });
  const primero = dialogo.querySelector("input, select, textarea");
  if (primero) primero.focus();
  dialogo.addEventListener("close", () => { if (origen && origen.isConnected) origen.focus(); }, { once: true });
}
/** Cierre por botón, clic en el fondo o Escape. */
export function prepararEditor(dialogo) {
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo || e.target.closest("[data-cerrar]")) dialogo.close();
  });
}

/** Número de un campo de formulario: "" → null. */
export const num = (v) => {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};

/* ---------- Fotos que ya están en el proyecto ----------
   Para agregar una foto nueva: ponla en su carpeta de "Slide Shows" y añade su ruta aquí,
   o pega en el formulario la dirección (URL) de una imagen publicada. */
export const FOTOS = [
  { grupo: "Platos del día", rutas: ["Slide Shows/Platos del dia/PlDia01.jpg", "Slide Shows/Platos del dia/PlDia02.jpg", "Slide Shows/Platos del dia/PlDia03jpg.jpg"] },
  { grupo: "Menú", rutas: [
    "Slide Shows/Menú Dia/Bowl de avena, plátano y proteína.jpg",
    "Slide Shows/Menú Dia/Bowl vegetariano de lentejas y quinoa.jpg",
    "Slide Shows/Menú Dia/Carne magra con quinua y verduras.jpg",
    "Slide Shows/Menú Dia/Ensalada de pollo, quinoa y palta.jpg",
    "Slide Shows/Menú Dia/Omelette de claras, avena y verduras.jpg",
    "Slide Shows/Menú Dia/Pescado al horno con papa y ensalada.jpg",
    "Slide Shows/Menú Dia/Pollo con arroz integral y verduras.jpg",
    "Slide Shows/Menú Dia/Pollo con arroz y verduras sin lácteos.jpg",
    "Slide Shows/Menú Dia/Salmón con camote y brócoli.jpg",
    "Slide Shows/Menú Dia/Wrap integral de pollo y verduras.jpg",
  ] },
  { grupo: "Platos exclusivos", rutas: [
    "Slide Shows/Platos exclusivos/Andino POwer Premium.jpg",
    "Slide Shows/Platos exclusivos/Andes & Mar Fitness.jpg",
    "Slide Shows/Platos exclusivos/Black Protein Bowl.jpg",
  ] },
  { grupo: "Portadas", rutas: ["Slide Shows/Portada/Platos x menú.jpg", "Slide Shows/Portada/Personaliza.jpg", "Slide Shows/Portada/Catering.jpg"] },
];
export const nombreFoto = (ruta) => decodeURIComponent(String(ruta).split("/").pop()).replace(/\.[^.]+$/, "");
