/* ============================================================
   platos.js · Malhú · datos de los platos
   ------------------------------------------------------------
   AGREGAR UN PLATO: pon la foto en su carpeta y añade UNA línea aquí:
     plato("menu", "Mi plato nuevo.jpg", "Lo que se ve en la foto", { precio: 18 }),
   El nombre sale del archivo (sin extensión, guiones → espacios, mayúscula inicial).
   Campos opcionales: nombre, descripcion, precio (número en soles),
   kcal, proteina, carbohidratos, grasa, fibra (en gramos por porción).
   Si un dato no se sabe, NO se inventa: se deja vacío y la web no lo muestra
   (el precio vacío muestra "Consultar").
   ============================================================ */

const CARPETAS = {
  dia: "Slide Shows/Platos del dia/",
  menu: "Slide Shows/Menú Dia/",
  exclusivo: "Slide Shows/Platos exclusivos/",
};

/* Información nutricional: valores APROXIMADOS por porción, calculados con
   USDA FoodData Central (SR Legacy, por 100 g) a partir de los ingredientes y
   gramos que dice cada plato en Firestore ("incluye"). Supuestos cuando no se
   indica cantidad: verduras de acompañamiento 30–80 g, ½ palta = 70 g,
   1 cdta. de aceite = 4.5 g. Platos del día: receta estimada desde la foto.
   Alpaca (Andino Power Premium): no figura en USDA; se usó carne magra de
   alpaca ≈ 130 kcal, 28 g de proteína y 2 g de grasa por 100 g cocidos. */
const NUTRICION = {
  // Platos del día (receta estimada)
  "Tortilla de espinaca": { kcal: 219, proteina: 16, carbohidratos: 7, grasa: 15, fibra: 2.7 },      // 2 huevos, 100 g espinaca, cebolla, 5 g aceite
  "Ensalada con huevo y frijoles": { kcal: 373, proteina: 35, carbohidratos: 30, grasa: 13, fibra: 8 }, // 100 g frijol, 60 g carne, 1 huevo, rúcula, aceituna
  "Salteado de verduras": { kcal: 184, proteina: 7, carbohidratos: 19, grasa: 11, fibra: 6.3 },      // brócoli, pimiento, champiñones, cebolla, 10 g aceite
  // Platos del menú (gramos de Firestore)
  "Bowl de avena, plátano y proteína": { kcal: 528, proteina: 39, carbohidratos: 75, grasa: 11, fibra: 9.1 },
  "Bowl vegetariano de lentejas y quinoa": { kcal: 404, proteina: 24, carbohidratos: 71, grasa: 4, fibra: 20.6 },
  "Carne magra con quinua y verduras": { kcal: 506, proteina: 47, carbohidratos: 42, grasa: 17, fibra: 9 },
  "Ensalada de pollo, quinoa y palta": { kcal: 458, proteina: 45, carbohidratos: 33, grasa: 17, fibra: 9.5 },
  "Omelette de claras, avena y verduras": { kcal: 323, proteina: 30, carbohidratos: 32, grasa: 8, fibra: 6 },
  "Pescado al horno con papa y ensalada": { kcal: 348, proteina: 39, carbohidratos: 44, grasa: 2, fibra: 5.3 },
  "Pollo con arroz integral y verduras": { kcal: 537, proteina: 54, carbohidratos: 52, grasa: 12, fibra: 7.5 },
  "Pollo con arroz y verduras sin lácteos": { kcal: 542, proteina: 54, carbohidratos: 57, grasa: 9, fibra: 5.7 },
  "Salmón con camote y brócoli": { kcal: 564, proteina: 40, carbohidratos: 48, grasa: 24, fibra: 10.9 },
  "Wrap integral de pollo y verduras": { kcal: 406, proteina: 43, carbohidratos: 32, grasa: 13, fibra: 7 },
  // Platos exclusivos
  "Andino Power Premium": { kcal: 587, proteina: 62, carbohidratos: 58, grasa: 14, fibra: 11.9 },
  "Andes & Mar Fitness": { kcal: 657, proteina: 48, carbohidratos: 71, grasa: 22, fibra: 12.9 },
  "Black Protein Bowl": { kcal: 661, proteina: 47, carbohidratos: 90, grasa: 19, fibra: 20.1 },
};

/** Convierte "pollo_con-arroz.jpg" en "Pollo con arroz". */
function nombreDesdeArchivo(archivo) {
  const base = archivo.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

let contadorPlatos = 0;
function plato(categoria, archivo, alt, extra = {}) {
  const nombre = extra.nombre || nombreDesdeArchivo(archivo);
  extra = Object.assign({}, NUTRICION[nombre], extra);
  return {
    id: `${categoria}-${++contadorPlatos}`,
    categoria,                                     // "dia" | "menu" | "exclusivo"
    nombre,
    foto: CARPETAS[categoria] + archivo,
    alt,
    descripcion: extra.descripcion || "",
    precio: typeof extra.precio === "number" ? extra.precio : null,
    kcal: typeof extra.kcal === "number" ? extra.kcal : null,
    proteina: typeof extra.proteina === "number" ? extra.proteina : null,
    carbohidratos: typeof extra.carbohidratos === "number" ? extra.carbohidratos : null,
    grasa: typeof extra.grasa === "number" ? extra.grasa : null,
    fibra: typeof extra.fibra === "number" ? extra.fibra : null,
  };
}

const PLATOS = [
  /* ---------- Platos del día ----------
     Los archivos se llaman PlDia01..03 (sin nombre de plato): el nombre es PROVISIONAL,
     tomado de lo que se ve en la foto. Cámbialo por el nombre real. */
  plato("dia", "PlDia01.jpg", "Tortilla de espinaca alta, cortada en porción, sobre un plato azul", { nombre: "Tortilla de espinaca" }),
  plato("dia", "PlDia02.jpg", "Ensalada sobre rúcula con huevo duro en mitades, frijoles blancos, carne desmenuzada, aceitunas y tomate", { nombre: "Ensalada con huevo y frijoles" }),
  plato("dia", "PlDia03jpg.jpg", "Salteado de brócoli, pimiento rojo, champiñones y cebolla en un plato hondo blanco", { nombre: "Salteado de verduras" }),

  /* ---------- Platos del menú ---------- */
  plato("menu", "Bowl de avena, plátano y proteína.jpg", "Bowl de avena con rodajas de plátano, arándanos, frambuesas, proteína en polvo y mantequilla de maní"),
  plato("menu", "Bowl vegetariano de lentejas y quinoa.jpg", "Bowl oscuro con lentejas y quinoa, tomate picado, palta, rodaja de limón y hojas verdes"),
  plato("menu", "Carne magra con quinua y verduras.jpg", "Bowl blanco con quinua, carne molida salteada con verduras, cebolla morada y hierbas"),
  plato("menu", "Ensalada de pollo, quinoa y palta.jpg", "Plato con quinoa, tiras de pollo a la plancha, láminas de palta y pico de gallo"),
  plato("menu", "Omelette de claras, avena y verduras.jpg", "Omelette doblado con tomates cherry y espinaca sobre un plato blanco"),
  plato("menu", "Pescado al horno con papa y ensalada.jpg", "Filete de pescado al horno con papas pequeñas, rodaja de limón y ensalada de hojas verdes"),
  plato("menu", "Pollo con arroz integral y verduras.jpg", "Plato con arroz, cubos de pollo dorado, brócoli, zanahoria y cebolla morada"),
  plato("menu", "Pollo con arroz y verduras sin lácteos.jpg", "Bowl blanco con arroz, pollo a la plancha en tiras, pico de gallo con palta y limón"),
  plato("menu", "Salmón con camote y brócoli.jpg", "Filete de salmón dorado con bastones de camote asado y brócoli"),
  plato("menu", "Wrap integral de pollo y verduras.jpg", "Wrap integral cortado en dos mitades, relleno de pollo, lechuga, tomate y cebolla"),

  /* ---------- Platos exclusivos (nombre y precio vienen de Firestore) ---------- */
  plato("exclusivo", "Andino POwer Premium.jpg", "Bowl con quinua, frijol negro, camote asado, láminas de palta, tomates cherry y salsa verde", { nombre: "Andino Power Premium" }),
  plato("exclusivo", "Andes & Mar Fitness.jpg", "Filete de trucha dorado sobre quinua, camote asado, tomate, cebolla morada, habas y hojas verdes"),
  plato("exclusivo", "Black Protein Bowl.jpg", "Bowl de avena con cacao, arándanos, frambuesas, nueces y semillas"),
];
