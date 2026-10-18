/* ============================================================
   ingredientes.js · Malhú · datos de "Arma tu plato"
   ------------------------------------------------------------
   AGREGAR UN INGREDIENTE: añade UNA entrada en INGREDIENTES, por ejemplo:
     ingrediente({ id: "yuca", categoria: "base", nombre: "Yuca sancochada",
                   descripcion: "...", porcion: "150 g", precio: 4, kcal: 240,
                   proteina: 2, carbo: 57, grasa: 0.4, vitaminas: ["C"] }),
   - Valores POR PORCIÓN (la que dice "porcion").
   - Dato que no se conoce = null: la web muestra "—" y no lo suma.
   - precio: EXTRA en soles que se suma al precio del plato armado; null = "Incluido".
   - foto (opcional): ruta de la imagen. Si no se pone, se usa Slide Shows/Ingredientes/<id>.jpg;
     mientras ese archivo no exista se ve una ficha con el emoji.
   - emoji (opcional): relleno de la ficha; si falta, se elige por categoría.
   - vitaminas: las que aportan al menos el 10 % del valor diario por porción
     (VD de referencia FDA: A 900 µg RAE, C 90 mg, E 15 mg, K 120 µg, B6 1.7 mg,
     B9 folato 400 µg DFE, B12 2.4 µg).

   Fuente nutricional: USDA FoodData Central, base SR Legacy (valores por 100 g,
   escalados a la porción). Cada dato lleva su código FDC.
   ============================================================ */

/* Precio del plato armado en soles. El "Precio base" que el dueño guarda en
   plato-personalizado-admin.html tiene prioridad; este valor solo se usa si aún
   no se guardó (es el mismo 25.00 que ya traía ese panel). */
const PRECIO_BASE_PLATO = 25;

const CATEGORIAS = [
  { id: "base", nombre: "Base" },
  { id: "proteinas", nombre: "Proteínas" },
  { id: "verduras", nombre: "Verduras" },
  { id: "complementos", nombre: "Complementos y salsas" },
  { id: "postres", nombre: "Postres" },
];

/* Fotos de ingredientes: "Slide Shows/Ingredientes/<id>.jpg" (600 × 600 px). Aparecen solas al agregarlas. */
const CARPETA_INGREDIENTES = "Slide Shows/Ingredientes/";

const esNum = (v) => typeof v === "number" && isFinite(v);
function ingrediente(d) {
  return {
    id: d.id,
    categoria: d.categoria,
    nombre: d.nombre,
    descripcion: d.descripcion || "",
    // Sin foto propia se busca la foto esperada; si no existe, se ve la ficha con el emoji
    foto: d.foto || CARPETA_INGREDIENTES + d.id + ".jpg",
    emoji: d.emoji || "",
    porcion: d.porcion || "",
    precio: esNum(d.precio) ? d.precio : null,
    kcal: esNum(d.kcal) ? d.kcal : null,
    proteina: esNum(d.proteina) ? d.proteina : null,
    carbo: esNum(d.carbo) ? d.carbo : null,
    grasa: esNum(d.grasa) ? d.grasa : null,
    vitaminas: Array.isArray(d.vitaminas) ? d.vitaminas : [],
  };
}

const INGREDIENTES = [
  /* ---------- Base ---------- */
  // USDA FDC 168878 · Rice, white, long-grain, regular, enriched, cooked · 100 g: 130 kcal, P 2.69, C 28.2, G 0.28
  ingrediente({ id: "arroz-blanco", emoji: "🍚", categoria: "base", nombre: "Arroz blanco", descripcion: "Graneado, recién hecho.", porcion: "150 g",
    precio: null, kcal: 195, proteina: 4, carbo: 42.3, grasa: 0.4, vitaminas: ["B9"] }),
  // USDA FDC 169704 · Rice, brown, long-grain, cooked · 100 g: 123 kcal, P 2.74, C 25.6, G 0.97
  ingrediente({ id: "arroz-integral", emoji: "🍚", categoria: "base", nombre: "Arroz integral", descripcion: "Grano entero, textura firme.", porcion: "150 g",
    precio: null, kcal: 185, proteina: 4.1, carbo: 38.4, grasa: 1.5, vitaminas: ["B6"] }),
  // USDA FDC 168917 · Quinoa, cooked · 100 g: 120 kcal, P 4.4, C 21.3, G 1.92
  ingrediente({ id: "quinua", emoji: "🌾", categoria: "base", nombre: "Quinua", descripcion: "Quinua blanca graneada.", porcion: "150 g",
    precio: null, kcal: 180, proteina: 6.6, carbo: 32, grasa: 2.9, vitaminas: ["B6", "B9"] }),
  // USDA FDC 170440 · Potatoes, boiled, cooked without skin, flesh, without salt · 100 g: 86 kcal, P 1.71, C 20, G 0.1
  // (dato de papa blanca hervida; la papa amarilla puede variar)
  ingrediente({ id: "papa-amarilla", emoji: "🥔", categoria: "base", nombre: "Papa amarilla sancochada", descripcion: "Sin cáscara, suave y cremosa.", porcion: "150 g",
    precio: null, kcal: 129, proteina: 2.6, carbo: 30, grasa: 0.2, vitaminas: ["C", "B6"] }),
  // USDA FDC 168484 · Sweet potato, cooked, boiled, without skin · 100 g: 76 kcal, P 1.37, C 17.7, G 0.14
  ingrediente({ id: "camote", emoji: "🍠", categoria: "base", nombre: "Camote sancochado", descripcion: "Dulce, en rodajas.", porcion: "150 g",
    precio: null, kcal: 114, proteina: 2.1, carbo: 26.6, grasa: 0.2, vitaminas: ["A", "C", "B6"] }),
  // USDA FDC 169737 · Pasta, cooked, enriched, without added salt · 100 g: 158 kcal, P 5.8, C 30.9, G 0.93
  ingrediente({ id: "fideos", emoji: "🍝", categoria: "base", nombre: "Fideos", descripcion: "Al dente, sin salsa.", porcion: "150 g",
    precio: null, kcal: 237, proteina: 8.7, carbo: 46.4, grasa: 1.4, vitaminas: ["B9"] }),

  /* ---------- Proteínas ---------- */
  // USDA FDC 171477 · Chicken, broilers or fryers, breast, meat only, cooked, roasted · 100 g: 165 kcal, P 31, C 0, G 3.57
  ingrediente({ id: "pollo", emoji: "🍗", categoria: "proteinas", nombre: "Pechuga de pollo", descripcion: "A la plancha, sin piel.", porcion: "120 g",
    precio: null, kcal: 198, proteina: 37.2, carbo: 0, grasa: 4.3, vitaminas: ["B6", "B12"] }),
  // PENDIENTE de verificar en USDA (Beef, tenderloin, lean only, cooked, broiled)
  ingrediente({ id: "lomo", emoji: "🥩", categoria: "proteinas", nombre: "Lomo de res", descripcion: "Salteado al punto.", porcion: "120 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // USDA FDC 171956 · Fish, cod, Atlantic, cooked, dry heat · 100 g: 105 kcal, P 22.8, C 0, G 0.86
  // (referencia de pescado blanco: confirmar la especie que usa Malhú)
  ingrediente({ id: "pescado", emoji: "🐟", categoria: "proteinas", nombre: "Filete de pescado blanco", descripcion: "Al horno, con limón.", porcion: "120 g",
    precio: null, kcal: 126, proteina: 27.4, carbo: 0, grasa: 1, vitaminas: ["B6", "B12"] }),
  // PENDIENTE (Fish, salmon, Atlantic, farmed, cooked, dry heat)
  ingrediente({ id: "salmon", emoji: "🐟", categoria: "proteinas", nombre: "Salmón", descripcion: "Dorado a la plancha.", porcion: "120 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // PENDIENTE (Egg, whole, cooked, hard-boiled)
  ingrediente({ id: "huevo", emoji: "🥚", categoria: "proteinas", nombre: "Huevo sancochado", descripcion: "Yema firme.", porcion: "1 unidad (50 g)",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // PENDIENTE (Lentils, mature seeds, cooked, boiled, without salt)
  ingrediente({ id: "lentejas", emoji: "🫘", categoria: "proteinas", nombre: "Lentejas", descripcion: "Guisadas, espesas.", porcion: "150 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),

  /* ---------- Verduras ---------- */
  // PENDIENTE (Broccoli, cooked, boiled, drained, without salt)
  ingrediente({ id: "brocoli", emoji: "🥦", categoria: "verduras", nombre: "Brócoli", descripcion: "Al vapor, crocante.", porcion: "80 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // PENDIENTE (Carrots, cooked, boiled, drained, without salt)
  ingrediente({ id: "zanahoria", emoji: "🥕", categoria: "verduras", nombre: "Zanahoria", descripcion: "En bastones, sancochada.", porcion: "80 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // PENDIENTE (Tomatoes, red, ripe, raw, year round average)
  ingrediente({ id: "tomate", emoji: "🍅", categoria: "verduras", nombre: "Tomate", descripcion: "Fresco, en cubos.", porcion: "80 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // PENDIENTE (Lettuce, cos or romaine, raw)
  ingrediente({ id: "lechuga", emoji: "🥬", categoria: "verduras", nombre: "Lechuga", descripcion: "Hojas frescas.", porcion: "50 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // PENDIENTE (Spinach, cooked, boiled, drained, without salt)
  ingrediente({ id: "espinaca", emoji: "🥬", categoria: "verduras", nombre: "Espinaca", descripcion: "Salteada.", porcion: "80 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // PENDIENTE (Beans, snap, green, cooked, boiled, drained, without salt)
  ingrediente({ id: "vainita", emoji: "🫛", categoria: "verduras", nombre: "Vainita", descripcion: "Sancochada, verde intenso.", porcion: "80 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),

  /* ---------- Complementos y salsas ---------- */
  // PENDIENTE (Avocados, raw, all commercial varieties)
  ingrediente({ id: "palta", emoji: "🥑", categoria: "complementos", nombre: "Palta", descripcion: "En láminas.", porcion: "50 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // PENDIENTE (Corn, sweet, yellow, cooked, boiled, drained, without salt). El choclo peruano puede variar.
  ingrediente({ id: "choclo", emoji: "🌽", categoria: "complementos", nombre: "Choclo desgranado", descripcion: "Sancochado.", porcion: "80 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // PENDIENTE (Cheese, fresh, queso fresco)
  ingrediente({ id: "queso-fresco", emoji: "🧀", categoria: "complementos", nombre: "Queso fresco", descripcion: "En cubos.", porcion: "40 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // Sin dato verificable: la receta (cebolla, limón, ají, sal) varía. Completar con la receta de Malhú.
  ingrediente({ id: "salsa-criolla", emoji: "🧅", categoria: "complementos", nombre: "Salsa criolla", descripcion: "Cebolla morada, limón y ají.", porcion: "40 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // PENDIENTE (Oil, olive, salad or cooking)
  ingrediente({ id: "aceite-oliva", emoji: "🫒", categoria: "complementos", nombre: "Aceite de oliva", descripcion: "Un chorrito para aliñar.", porcion: "1 cucharada (13.5 g)",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),

  /* ---------- Postres ---------- */
  // PENDIENTE (Bananas, raw)
  ingrediente({ id: "platano", emoji: "🍌", categoria: "postres", nombre: "Plátano", descripcion: "Maduro, entero.", porcion: "1 unidad (118 g)",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // PENDIENTE (Papayas, raw)
  ingrediente({ id: "papaya", categoria: "postres", nombre: "Papaya", descripcion: "En cubos.", porcion: "140 g",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // Sin dato verificable (receta casera; Tablas Peruanas CENAN no consultadas). Completar.
  ingrediente({ id: "mazamorra-morada", emoji: "🍮", categoria: "postres", nombre: "Mazamorra morada", descripcion: "Con fruta y canela.", porcion: "1 vaso (200 g)",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
  // Sin dato verificable (receta casera). Completar.
  ingrediente({ id: "arroz-con-leche", emoji: "🍮", categoria: "postres", nombre: "Arroz con leche", descripcion: "Cremoso, con canela.", porcion: "1 vaso (200 g)",
    precio: null, kcal: null, proteina: null, carbo: null, grasa: null, vitaminas: [] }),
];
