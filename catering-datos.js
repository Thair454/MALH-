/* ============================================================
   catering-datos.js · Malhú · datos de la página de catering
   ------------------------------------------------------------
   Aquí se cambian precios, fotos y textos. No hace falta tocar otro archivo.
   - precioPorPersona: número en soles (ej. 35) o null mientras no esté definido
     (con null la web muestra "Por confirmar" y no lo suma al total).
   - personasMax: null = sin tope (para "50 o más").
   - incluye: lista de lo que trae ese tipo de evento; vacía = la sección no se muestra.
   - emoji: relleno que se ve en el carrito si la foto falta o no carga.
   ============================================================ */

const CARPETA_CATERING = "Slide Shows/Catering/";

/* Tope del campo de personas cuando un tipo no tiene máximo */
const PERSONAS_TOPE = 500;

const TIPOS = [
  {
    id: "reunion",
    emoji: "☕", // relleno si falta la foto
    nombre: "Reunión pequeña",
    personasMin: 10,
    personasMax: 20,
    precioPorPersona: null, // COMPLETAR
    foto: CARPETA_CATERING + "catering01.jpg",
    alt: "Mesa de bocaditos para un bautizo: sánguches en pan brioche, empanadas, alfajores, brownies y mini tartaletas, con arreglos de flores blancas",
    descripcion: "Para reuniones de trabajo, cumpleaños en casa y celebraciones íntimas.",
    incluye: [], // COMPLETAR: qué incluye este tipo de evento (se muestra en el detalle del pedido)
  },
  {
    id: "celebracion",
    emoji: "🎂", // relleno si falta la foto
    nombre: "Celebración",
    personasMin: 20,
    personasMax: 50,
    precioPorPersona: null, // COMPLETAR
    foto: CARPETA_CATERING + "catering02.jpg",
    alt: "Buffet al aire libre en un jardín: sánguches de jamón, croissants rellenos, ensalada de pasta, uvas, fresas y naranjas sobre bases de madera",
    descripcion: "Cumpleaños, bautizos y reuniones familiares con la mesa lista.",
    incluye: [], // COMPLETAR: qué incluye este tipo de evento (se muestra en el detalle del pedido)
  },
  {
    id: "grande",
    emoji: "🥂", // relleno si falta la foto
    nombre: "Evento grande",
    personasMin: 50,
    personasMax: null,
    precioPorPersona: null, // COMPLETAR
    foto: CARPETA_CATERING + "catering05.jpg",
    alt: "Mesa larga de picoteo con croissants rellenos, tablas de quesos, embutidos y frutas, brochetas caprese, mini sánguches y jarras de limonada",
    descripcion: "Matrimonios y eventos de empresa con mesa completa y llegada puntual.",
    incluye: [], // COMPLETAR: qué incluye este tipo de evento (se muestra en el detalle del pedido)
  },
];

/* Galería "Nuestro trabajo". tipo: el tipo de evento con el que se relaciona la foto. */
const GALERIA = [
  {
    foto: CARPETA_CATERING + "catering01.jpg",
    alt: TIPOS[0].alt,
    pie: "Bocaditos dulces y salados con mesa decorada",
    tipo: "reunion",
  },
  {
    foto: CARPETA_CATERING + "catering04.jpg",
    alt: "Mozo con camisa blanca sirviendo una bandeja de tostadas de pan integral con pesto y nueces",
    pie: "Bocaditos servidos a los invitados",
    tipo: "reunion",
  },
  {
    foto: CARPETA_CATERING + "catering02.jpg",
    alt: TIPOS[1].alt,
    pie: "Buffet al aire libre",
    tipo: "celebracion",
  },
  {
    foto: CARPETA_CATERING + "catering03.jpg",
    alt: "Canapés de salmón y jamón sobre bandejas de pizarra, brochetas caprese en cucharitas y quesos al fondo",
    pie: "Canapés y bocaditos salados",
    tipo: "celebracion",
  },
  {
    foto: CARPETA_CATERING + "catering05.jpg",
    alt: TIPOS[2].alt,
    pie: "Mesa larga para un evento grande",
    tipo: "grande",
  },
];

/* "¿Qué ofrecemos?": solo lo confirmado. */
const OFRECE = [
  { titulo: "Bocaditos dulces y salados", icono: "bocadito" },
  { titulo: "Coffee break", icono: "taza" },
  { titulo: "Menús completos", icono: "plato" },
  { titulo: "Para matrimonios, cumpleaños y reuniones de empresa", icono: "evento" },
  { titulo: "Llegada puntual", icono: "reloj" },
  { titulo: "Mesa armada", icono: "mesa" },
];
