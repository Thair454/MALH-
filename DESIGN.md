---
name: Malhú Coffee break & Catering
description: Gourmet oscuro con marca verde bosque; la comida iluminada como bajo una lámpara y una comanda de cocina como firma.
colors:
  azafran: "#f28c28"
  azafran-hover: "#ffa041"
  bosque: "#395941"
  bosque-2: "#2c4733"
  verde-fitness: "#7bc67e"
  tomate: "#e8583a"
  brasa: "#b4521e"
  carbon: "#14110f"
  carbon-2: "#1c1815"
  carbon-3: "#26201b"
  linea: "#3a3129"
  crema: "#f5ebdd"
  crema-2: "#c9bba8"
  crema-3: "#968877"
  salvia: "#d8e3d4"
  papel: "#f3e6d0"
  tinta: "#2a211a"
  error: "#ff7a5c"
typography:
  display:
    fontFamily: "Gloock, Georgia, serif"
    fontSize: "clamp(3.25rem, 8vw + 1rem, 9.5rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Gloock, Georgia, serif"
    fontSize: "clamp(2.5rem, 5vw + 0.5rem, 6rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Gloock, Georgia, serif"
    fontSize: "clamp(1.5rem, 1.6vw + 1rem, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.05
  subtitle:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 0.6vw + 1rem, 1.5rem)"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  data:
    fontFamily: "Spline Sans Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.04em"
  price:
    fontFamily: "Spline Sans Mono, ui-monospace, monospace"
    fontSize: "clamp(1.25rem, 1vw + 1rem, 1.75rem)"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  marca:
    fontFamily: "Tenor Sans, Gill Sans, sans-serif"
    fontWeight: 400
    letterSpacing: "0.06em"
rounded:
  sm: "2px"
  card: "14px"
  pill: "999px"
spacing:
  gutter: "clamp(16px, 4vw, 64px)"
  section: "clamp(96px, 14vh, 192px)"
  s1: "4px"
  s2: "8px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "64px"
components:
  button-primary:
    backgroundColor: "{colors.azafran}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.azafran-hover}"
  button-ghost:
    textColor: "{colors.crema}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  chip:
    textColor: "{colors.crema-2}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.crema}"
    textColor: "{colors.carbon}"
  field:
    backgroundColor: "{colors.carbon-3}"
    textColor: "{colors.crema}"
    rounded: "{rounded.sm}"
    height: "48px"
  ticket:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    typography: "{typography.data}"
    padding: "24px 32px 40px"
  card:
    backgroundColor: "{colors.carbon-2}"
    rounded: "{rounded.card}"
---

# Design System: Malhú Coffee break & Catering

## Overview

**Creative North Star: "La comanda de la noche"**

La web es un servicio de cocina de noche: la comida aparece iluminada sobre carbón cálido, como platos que salen del pase bajo una lámpara, y la marca Malhú pone su verde bosque en las superficies que importan (telón de entrada, cotizador, pie de página). La interfaz toma de la cocina solo lo que tiene datos reales: precios y macros en tipografía de ticket, y un cotizador que imprime una comanda de papel crema que se envía por WhatsApp.

La densidad respira: un mensaje por pantalla, titulares enormes que se cruzan con el plato, mucho espacio negativo. Una sección densa (carrusel, secuencia fijada, mesa con física) siempre va seguida de una tranquila (pasos, preguntas). El movimiento tiene un solo idioma y existe para explicar o para jugar, nunca como relleno.

Rechazos confirmados: héroes partidos texto/foto con insignias, filas de tres tarjetas iguales, degradados morados, vidrio decorativo, íconos en cuadrados redondeados, etiquetas sobre los titulares, tonos fríos o azules sobre la comida, fotos de stock.

**Key Characteristics:**
- Carbón cálido como fondo, verde bosque como superficie de marca, azafrán como única acción.
- Titulares en Gloock a escala de cartel que se intercalan con el plato (una línea detrás, otra delante).
- Ticket de comanda (papel, mono, borde dentado) como componente firma.
- Una curva y tres duraciones; solo `transform` y `opacity`.
- Todo legible sin JavaScript y con movimiento reducido.

## Colors

Paleta restringida y cálida: neutros tintados de carbón y crema, un acento de acción, un verde de marca para superficies y tres brillos que identifican cada puerta del inicio.

### Primary
- **Azafrán de cocina** (`azafran`): el único color de acción: botones principales, precios, foco visible, barra de progreso. Texto encima siempre en carbón.

### Secondary
- **Verde bosque Malhú** (`bosque`, `bosque-2`): color del logo. Ocupa superficies completas (telón de marca, sección del cotizador, footer), nunca acentos sueltos. Texto secundario encima en salvia.

### Tertiary
- **Verde fresco fitness** (`verde-fitness`): solo línea fitness (pestaña, macros, precio fitness) y el brillo de la opción "Platos". No se confunde con el bosque: uno claro y vivo, el otro oscuro y de marca.
- **Tomate** (`tomate`): brillo de "Arma tu plato" y su sección.
- **Brasa** (`brasa`): pozos de luz cálida detrás de la comida. Decorativo, nunca texto.

### Neutral
- **Carbón** (`carbon`, `carbon-2`, `carbon-3`): fondo base, superficies elevadas, campos.
- **Línea** (`linea`): bordes y separadores de 1 px.
- **Crema** (`crema`, `crema-2`, `crema-3`): texto principal, subtítulos, apoyo (crema-3 nunca bajo 14 px).
- **Salvia** (`salvia`): texto secundario sobre bosque.
- **Papel y tinta** (`papel`, `tinta`): el ticket de comanda.

### Named Rules
**The One Action Rule.** Solo el azafrán marca acciones. Si algo es clicable y principal, es azafrán con texto carbón; nada más compite.
**The Warm Light Rule.** La profundidad viene de pozos de luz radiales cálidos (brasa/azafrán al 10–30 %), nunca de grises fríos ni texturas de ruido.
**The Forest Surface Rule.** El verde bosque se usa a escala de superficie (secciones completas); un botón o borde verde bosque suelto es un error.

## Typography

**Display Font:** Gloock (con Georgia)
**Body Font:** Hanken Grotesk (con system-ui)
**Label/Mono Font:** Spline Sans Mono (con ui-monospace)
**Marca:** Tenor Sans, solo para la firma "MALHÚ" del footer; el logo real es imagen.

**Character:** Un serif de alto contraste con terminales de tinta, como la carta de un restaurante de autor impresa en grande, sobre una grotesca humanista cálida; la mono de impresora térmica aparece solo donde hay números.

### Hierarchy
- **Display** (400, clamp 3.25–9.5rem, 0.92): titulares del inicio y del cierre.
- **Headline** (400, clamp 2.5–6rem, 0.95): un titular por sección.
- **Title** (400, clamp 1.5–2.25rem, 1.05): tarjetas, platos, pasos.
- **Subtitle** (500, clamp 1.125–1.5rem, 1.4): la frase que acompaña a cada titular, máx. ~40ch.
- **Body** (400, 16 px; 17 px ≥ 1024, 1.6): apoyo, máx. 62ch.
- **Data / Price** (mono 500/600, tabular): precios, macros, números de paso, ticket.

### Named Rules
**The Three Levels Rule.** Cada sección tiene titular, subtítulo y como mucho un bloque de apoyo; entran en ese orden de lectura.
**The No Kicker Rule.** Nada encima del titular: ni etiquetas, ni números de sección decorativos.
**The Mono Means Data Rule.** La mono solo lleva cifras o datos reales (precio, macros, comanda), nunca adorno.

## Layout

Página única con retícula de 4 / 8 / 12 columnas (<768 / 768–1023 / ≥1024), gutter 16–24 px, margen lateral `gutter` y ancho máximo de 1440 px (las fotos pueden sangrar). Ritmo vertical entre secciones `section`, con más aire sobre el titular que debajo. Los encabezados de sección usan 7 + 5 columnas (titular / subtítulo alineados abajo). Inicio y secuencia ocupan 100 svh; la mesa 70–80 svh. En móvil todo pasa a una columna y el texto del inicio queda bajo el plato.

## Elevation & Depth

Sistema plano con capas tonales (carbón → carbón-2 → carbón-3) y luz cálida radial. Las sombras solo existen bajo objetos físicos: el plato, los bocaditos de la mesa y el ticket.

### Shadow Vocabulary
- **Objeto sobre la mesa** (`box-shadow: 0 18px 30px -12px rgb(0 0 0 / 0.7)`): bocaditos de la mesa antigravedad.
- **Papel** (`filter: drop-shadow(0 30px 40px rgb(0 0 0 / 0.45))`): el ticket (drop-shadow para respetar el borde dentado).
- **Ficha flotante** (`box-shadow: 0 24px 60px -24px rgb(0 0 0 / 0.8)`): ficha de detalle sobre la mesa.

## Shapes

Tres radios y nada más: 2 px en campos, 14 px en tarjetas y fotos, píldora en botones, chips y controles circulares. El plato y los bocaditos son círculos; el ticket tiene borde inferior dentado (máscara cónica de 9 px). Bordes de 1 px en `linea` o crema al 30 %.

## Components

### Buttons
- **Shape:** píldora (999px), 52 px de alto (48 en móvil).
- **Primary:** azafrán con texto carbón, Hanken 600; ícono de WhatsApp o flecha.
- **Hover / Focus:** fondo azafrán-hover y flecha +4 px en 0.18 s (solo puntero fino); al presionar `scale(0.97)`; foco con contorno azafrán de 2 px a 3 px de distancia.
- **Ghost:** texto crema con borde crema al 30 % que pasa a crema completo en hover.

### Chips
- **Style:** píldora con borde crema al 25 % (salvia al 40 % sobre bosque), 44 px de alto.
- **State:** seleccionado = fondo crema y texto carbón. Son radios nativos ocultos, operables con flechas.

### Cards / Containers
- **Corner Style:** 14 px.
- **Background:** carbón-2 o foto a sangre con velo de carbón hacia abajo.
- **Shadow Strategy:** ninguna; profundidad por tono y luz.
- **Internal Padding:** 20–32 px.

### Inputs / Fields
- **Style:** fondo carbón-3 (bosque-2 sobre bosque), radio 2 px, línea inferior de 1 px, etiqueta visible arriba.
- **Focus:** contorno azafrán; el selector de cantidad muestra el foco en todo su contenedor.
- **Error:** borde y texto en `error` con ícono; el mensaje dice el problema y cómo arreglarlo.

### Navigation
- Fija, transparente sobre el inicio y carbón-2 al 95 % tras 80 px; se esconde al bajar y vuelve al subir. Enlaces crema-2 con subrayado que crece desde la izquierda. En móvil: menú a pantalla completa con titulares Gloock y foco atrapado.

### Ticket de comanda (firma)
Papel crema con tinta, cabecera "MALHÚ · Comanda N.º", renglones con guía de puntos que se imprimen al cambiar el pedido, total en mono grande y botón de envío a WhatsApp. Se usa en el cotizador y en "Arma tu plato".

### Carrusel del inicio (firma)
Tres puertas (Coffee break, Platos, Arma tu plato). El plato sale girando hacia un lado y el siguiente entra desde el otro; los ingredientes orbitan, flotan y se dispersan; el brillo cambia de color. Avanza solo con barra de progreso y se pausa con mouse encima, con foco o con "Pausar animaciones".

## Do's and Don'ts

### Do:
- **Do** usar una sola curva `cubic-bezier(0.23, 1, 0.32, 1)` y las duraciones 0.18 / 0.6 / 1.0 s; scrub y movimiento constante en lineal.
- **Do** animar solo `transform` y `opacity`, y dejar todo el contenido legible sin JavaScript y con movimiento reducido.
- **Do** mostrar fotos reales del cliente; si falta una, usar el marcador que dice qué foto va.
- **Do** mantener el texto del inicio visible desde el primer pintado (es el LCP).

### Don't:
- **Don't** poner etiquetas o números decorativos encima de los titulares.
- **Don't** usar tonos fríos, azules o grises neutros sobre la comida.
- **Don't** usar verde bosque como acento suelto ni verde fresco fuera de lo fitness.
- **Don't** ocultar con `visibility` lo que todavía no se reveló: debe seguir siendo enfocable con Tab.
- **Don't** inventar precios, macros, testimonios ni cifras.
