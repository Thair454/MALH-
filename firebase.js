/* ============================================================
   firebase.js · Malhú · conexión ÚNICA con Firebase (proyecto malhudemo)
   ------------------------------------------------------------
   Se carga como módulo en cada página que usa la base de datos:
     <script type="module" src="firebase.js"></script>
   Los módulos terminan de ejecutarse antes de "DOMContentLoaded", así que
   los scripts clásicos pueden usar window.MalhuDB dentro de ese evento.
   Las páginas del propietario lo importan directamente:
     import { MalhuDB } from "./firebase.js";
   Si Firebase no carga (sin internet), window.MalhuDB no existe y cada
   página del cliente sigue con sus datos locales.

   Lectura (pública):
     platos(coleccion)        → [{ id, docId, coleccion, nombre, descripcion, aporte, precio, foto, kcal, proteina, carbohidratos, grasa, fibra }]
     ingredientes({ todos })  → [{ id, docId, coleccion, nombre, categoria, categoriaNombre, precio, porcion, gramos, tamano, unidad, maximo, kcal, proteina, carbo, grasa }]
     guardarPedido(p)         → id del documento creado en "Pedidos"
   Propietario (necesita sesión; las reglas de Firestore lo exigen):
     entrar(correo, clave) · salir() · esperarSesion() → usuario o null
     guardarPlato(coleccion, docId|null, datos) · guardarIngrediente(coleccion, docId|null, datos) · borrar(coleccion, docId)
     escucharPedidos(alCambiar, alFallar) → función para dejar de escuchar · actualizarPedido(docId, cambios)

   Los documentos de Firestore se escribieron a mano: los nombres de campo
   se leen sin importar mayúsculas, tildes ni espacios sobrantes
   ("Categoria", "categoria ", "precio_porcion", "maximo_de_porcion"...).
   Al guardar desde el panel se reescriben con los nombres correctos.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  initializeFirestore, collection, doc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBYwaGVn1k4r6_RIwl5mDkw1sNYNdo1XYc",
  authDomain: "malhudemo.firebaseapp.com",
  databaseURL: "https://malhudemo-default-rtdb.firebaseio.com",
  projectId: "malhudemo",
  storageBucket: "malhudemo.firebasestorage.app",
  messagingSenderId: "954046272999",
  appId: "1:954046272999:web:996265a67bc7b55f999942",
  measurementId: "G-481Z1Y0112",
};

const app = initializeApp(firebaseConfig);
// ignoreUndefinedProperties: los pedidos traen campos opcionales sin valor (Firestore rechaza undefined)
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
const auth = getAuth(app);

/* Colecciones (los nombres son los que ya existen en Firestore) */
const COLECCIONES = {
  dia: "platos_del_dia",
  menu: "Plato fijos",
  exclusivos: "platos_exclusivos",
  ingredientes: "Ingredientes ", // se creó con un espacio al final
  pedidos: "Pedidos",
};

/* ---------- Lectura tolerante de campos ---------- */
const clave = (t) => String(t).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_");
function campo(datos, ...nombres) {
  const buscados = nombres.map(clave);
  for (const [k, v] of Object.entries(datos)) if (buscados.includes(clave(k))) return v;
  return undefined;
}
const numero = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const texto = (v) => (v == null ? "" : String(v).trim());
const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
// "..." o vacío = foto pendiente
const url = (v) => (/^[.\s…]*$/.test(texto(v)) ? "" : texto(v));

/* ---------- Platos ("platos_del_dia", "Plato fijos", "platos_exclusivos") ---------- */
async function platos(coleccion) {
  const snap = await getDocs(collection(db, coleccion));
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      docId: d.id,
      coleccion,
      nombre: capitalizar(texto(campo(x, "nombre"))) || "Plato sin nombre",
      descripcion: texto(campo(x, "incluye", "descripcion")),
      aporte: texto(campo(x, "aporte")),
      precio: numero(campo(x, "precio_de_venta", "precio")),
      foto: url(campo(x, "imagen_url", "foto")),
      kcal: numero(campo(x, "kcal", "calorias")),
      proteina: numero(campo(x, "proteina", "proteinas")),
      carbohidratos: numero(campo(x, "carbohidratos")),
      grasa: numero(campo(x, "grasa", "grasas")),
      fibra: numero(campo(x, "fibra")),
      orden: numero(campo(x, "orden")),
    };
  }).sort((a, b) => (a.orden ?? 1e9) - (b.orden ?? 1e9) || a.docId.localeCompare(b.docId));
}

/* ---------- Ingredientes ---------- */
/* Categoría de Firestore → pestaña de "Arma tu plato" (las que no encajan se agrupan en "Otros") */
const CATEGORIAS = [
  { id: "proteinas", nombre: "Proteínas", guardar: "Proteína animal", re: /prote/ },
  { id: "base", nombre: "Cereales y carbohidratos", guardar: "Cereales y carbohidratos", re: /cereal|carbo|base/ },
  { id: "verduras", nombre: "Verduras", guardar: "Verduras", re: /verdura/ },
  { id: "frutas", nombre: "Frutas", guardar: "Frutas", re: /fruta/ },
  { id: "lacteos", nombre: "Lácteos y alternativas", guardar: "Lácteos y alternativas", re: /lacteo/ },
  { id: "grasas", nombre: "Grasas saludables", guardar: "Grasas saludables", re: /grasa/ },
  { id: "condimentos", nombre: "Condimentos", guardar: "Condimentos", re: /condimento|salsa/ },
  { id: "otros", nombre: "Otros", guardar: "Otros", re: /./ },
];
const categoriaDe = (t) => CATEGORIAS.find((c) => c.re.test(clave(t))) || CATEGORIAS[CATEGORIAS.length - 1];
const ordenCategoria = (id) => CATEGORIAS.findIndex((c) => c.id === id);

async function ingredientes({ todos = false } = {}) {
  // Se leen "Ingredientes " (la que existe) e "Ingredientes" por si algún día se corrige el nombre.
  const nombres = [COLECCIONES.ingredientes, "Ingredientes"];
  const snaps = await Promise.all(nombres.map((c) => getDocs(collection(db, c))));
  const vistos = new Set();
  const lista = [];
  snaps.forEach((snap, k) => snap.docs.forEach((d) => {
    const x = d.data();
    const nombre = capitalizar(texto(campo(x, "nombre")));
    if (!nombre) return;
    if (!todos && vistos.has(clave(nombre))) return; // repetido: el cliente ve solo uno
    vistos.add(clave(nombre));
    const cat = categoriaDe(texto(campo(x, "categoria")));
    const tam = numero(campo(x, "tamano_de_la_porcion", "porcion"));
    // Unidad guardada por el panel; si no hay, de 1 a 5 se entiende como unidades (1 huevo, 1 limón)
    const unidad = texto(campo(x, "unidad")) || (tam && tam <= 5 ? "unidad" : "g");
    const max = numero(campo(x, "maximo_por_porcion", "maximo_de_porcion", "maximo"));
    lista.push({
      id: "fs-" + d.id,
      docId: d.id,
      coleccion: nombres[k],
      nombre,
      categoria: cat.id,
      categoriaNombre: cat.nombre,
      precio: numero(campo(x, "precio_por_porcion", "precio_porcion", "precio")),
      tamano: tam,
      unidad,
      gramos: tam && unidad === "g" ? tam : null,
      porcion: !tam ? "" : unidad === "g" ? `${tam} g` : `${tam} ${tam === 1 ? "unidad" : "unidades"}`,
      maximo: max && max > 0 ? max : null,
      kcal: numero(campo(x, "kcal")),
      proteina: numero(campo(x, "proteina")),
      carbo: numero(campo(x, "carbohidratos", "carbo")),
      grasa: numero(campo(x, "grasa")),
    });
  }));
  return lista.sort((a, b) => ordenCategoria(a.categoria) - ordenCategoria(b.categoria));
}

/* ---------- Pedidos ---------- */
async function guardarPedido(pedido) {
  const ref = await addDoc(collection(db, COLECCIONES.pedidos), { ...pedido, creado: serverTimestamp() });
  return ref.id;
}

/* ---------- Sesión del propietario (Firebase Authentication) ---------- */
let primeraSesion;
const sesionLista = new Promise((r) => (primeraSesion = r));
onAuthStateChanged(auth, (u) => primeraSesion(u));
/** Usuario con sesión o null (espera a que Firebase recuerde la sesión guardada). */
const esperarSesion = () => sesionLista.then(() => auth.currentUser);
const entrar = (correo, clave) => signInWithEmailAndPassword(auth, correo, clave).then((c) => c.user);
const salir = () => signOut(auth);
const alCambiarSesion = (fn) => onAuthStateChanged(auth, fn);

/* ---------- Escritura (solo propietario) ----------
   Los documentos se reescriben completos con los nombres de campo correctos,
   así se limpian las variantes escritas a mano ("precio_porcion", "categoria "...). */
const sinVacios = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

async function guardarPlato(coleccion, docId, d) {
  const datos = sinVacios({
    nombre: texto(d.nombre),
    incluye: texto(d.descripcion),
    aporte: texto(d.aporte),
    precio_de_venta: numero(d.precio),
    imagen_url: texto(d.foto),
    kcal: numero(d.kcal),
    proteina: numero(d.proteina),
    carbohidratos: numero(d.carbohidratos),
    grasa: numero(d.grasa),
    fibra: numero(d.fibra),
    orden: numero(d.orden) ?? undefined,
    actualizado: serverTimestamp(),
  });
  if (docId) { await setDoc(doc(db, coleccion, docId), datos); return docId; }
  return (await addDoc(collection(db, coleccion), datos)).id;
}

async function guardarIngrediente(coleccion, docId, d) {
  const cat = CATEGORIAS.find((c) => c.id === d.categoria) || CATEGORIAS[CATEGORIAS.length - 1];
  const datos = {
    nombre: texto(d.nombre),
    categoria: cat.guardar,
    precio_por_porcion: numero(d.precio),
    "tamaño_de_la_porcion": numero(d.tamano),
    unidad: d.unidad === "unidad" ? "unidad" : "g",
    maximo_por_porcion: numero(d.maximo),
    kcal: numero(d.kcal),
    proteina: numero(d.proteina),
    carbohidratos: numero(d.carbo),
    grasa: numero(d.grasa),
    actualizado: serverTimestamp(),
  };
  const col = coleccion || COLECCIONES.ingredientes;
  if (docId) { await setDoc(doc(db, col, docId), datos); return docId; }
  return (await addDoc(collection(db, col), datos)).id;
}

const borrar = (coleccion, docId) => deleteDoc(doc(db, coleccion, docId));

/** Pedidos en vivo, del más reciente al más antiguo. */
function escucharPedidos(alCambiar, alFallar) {
  const q = query(collection(db, COLECCIONES.pedidos), orderBy("creado", "desc"));
  return onSnapshot(q, (snap) => alCambiar(snap.docs.map((d) => ({ docId: d.id, ...d.data() }))), alFallar);
}
const actualizarPedido = (docId, cambios) =>
  updateDoc(doc(db, COLECCIONES.pedidos, docId), { ...cambios, actualizado: serverTimestamp() });

export const MalhuDB = {
  COLECCIONES,
  CATEGORIAS: CATEGORIAS.map(({ id, nombre }) => ({ id, nombre })),
  platos, ingredientes, guardarPedido,
  esperarSesion, entrar, salir, alCambiarSesion,
  guardarPlato, guardarIngrediente, borrar, escucharPedidos, actualizarPedido,
};
window.MalhuDB = MalhuDB;
