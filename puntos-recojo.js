/* ============================================================
   puntos-recojo.js · Malhú · puntos y horarios de recojo (Huancayo)
   ------------------------------------------------------------
   PUNTOS: { id, letra, nombre, direccion, referencia, lat, lng, ventanas }
   - lat/lng: de OpenStreetMap (se cita el objeto OSM). null = por confirmar:
     ese punto no sale en el mapa, pero se puede elegir desde la lista.
   - referencia: el lugar exacto de encuentro (ej. "Puerta principal"). COMPLETAR.
   - ventanas: las 3 horas de recojo de ESE punto (mañana, tarde y noche), o null =
     "Horario por confirmar" (el punto aparece deshabilitado). Cada hora es fija:
     inicio y fin son la misma hora.
   Horas base de Malhú: mañana 7:00, tarde 12:30, noche 7:30 p. m.
   Cada punto se corre 30 min respecto del anterior (A +0, B +30, C +60, D +90, E +120).
   Para cambiar una hora, edita sus "ventanas" directamente.
   ============================================================ */

const TURNOS_BASE = [
  { nombre: "Mañana", hora: "07:00" },
  { nombre: "Tarde", hora: "12:30" },
  { nombre: "Noche", hora: "19:30" },
];

/** Las 3 horas base corridas N minutos (la diferencia de 30 min entre puntos). */
function turnosCorridos(minutos) {
  const mover = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    const t = h * 60 + m + minutos;
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  };
  return TURNOS_BASE.map((v) => ({ nombre: v.nombre, inicio: mover(v.hora), fin: mover(v.hora) }));
}

const PUNTOS = [
  {
    id: "real-plaza",
    letra: "A",
    nombre: "Real Plaza",
    direccion: "Av. Giráldez / Av. Ferrocarril, Huancayo",
    referencia: "", // COMPLETAR: punto exacto de encuentro
    // OSM way 430211328 (Centro Comercial Real Plaza)
    lat: -12.0674771,
    lng: -75.2048808,
    ventanas: turnosCorridos(0),
  },
  {
    id: "open-plaza",
    letra: "B",
    nombre: "Open Plaza",
    direccion: "Huancayo", // COMPLETAR
    referencia: "", // COMPLETAR
    // Sin resultado en OSM para "Open Plaza Huancayo" (sí aparece "Mallplaza - Huancayo",
    // way en -12.0625757, -75.2096121). Confirmar si es el mismo lugar.
    lat: null,
    lng: null,
    ventanas: turnosCorridos(30),
  },
  {
    id: "continental",
    letra: "C",
    nombre: "Universidad Continental",
    direccion: "Jr. San Agustín 1980, Huancayo (según OSM)",
    referencia: "", // COMPLETAR
    // OSM way 430254276 (Universidad Continental)
    lat: -12.0479883,
    lng: -75.1986795,
    ventanas: turnosCorridos(60),
  },
  {
    id: "upla",
    letra: "D",
    nombre: "Universidad Peruana Los Andes",
    direccion: "Calle Cometa 231, Palián, Huancayo",
    referencia: "", // COMPLETAR
    // OSM way 430254269 (campus en Palián). Hay otra sede en Av. Giráldez: confirmar cuál.
    lat: -12.042622,
    lng: -75.1899082,
    ventanas: turnosCorridos(90),
  },
  {
    id: "roosevelt",
    letra: "E",
    nombre: "Universidad Roosevelt",
    direccion: "Av. Giráldez 542, Huancayo",
    referencia: "", // COMPLETAR
    // OSM way 945152097 (sede Av. Giráldez). Hay otra en Av. San Carlos: confirmar cuál.
    lat: -12.0653745,
    lng: -75.2048971,
    ventanas: turnosCorridos(120),
  },
];
