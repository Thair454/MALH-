# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4. gsap (ScrollTrigger, SplitText, CustomEase), @gsap/react, lenis, motion (`motion/react`), matter-js, lucide-react. Elegido por el usuario en el brief. Versiones exactas fijadas en `package.json` (ver CLAUDE.md).

## Users

1. **Quien organiza un evento** (cumpleaños, reunión familiar, bautizo, matrimonio pequeño) y necesita bocaditos o un menú completo sin cocinar. Compara precio por persona y confianza en la puntualidad.
2. **Empresas** que contratan catering para reuniones, capacitaciones o celebraciones internas. Necesitan cotización clara y factura/boleta.
3. **Personas que comen fitness a diario** y quieren porciones con macros reales, por semana o por día.

## Product Purpose

**Malhú · Coffee break & Catering.** Servicio con tres puertas de entrada (así lo organizó el cliente en su prototipo): (1) **Coffee break y catering** para reuniones, celebraciones y empresas; (2) **Platos**: comida fitness, bocaditos y menús variados; (3) **Platos personalizados**: el cliente arma su plato (base, proteína, acompañamiento, porciones, notas) y lo envía por WhatsApp. La web existe para que el visitante **cotice y reserve por WhatsApp**. Éxito = clic en "Cotizar por WhatsApp" con un mensaje ya redactado (tipo de evento, personas, menú, estimado).

## Positioning

Confirmado por el usuario (las cuatro aplican):
- Cocina casera / de autor: recetas propias, hechas al momento.
- Fitness con macros reales: porciones y macros calculados por plato (los datos los aporta el usuario; nunca se inventan).
- Puntualidad y montaje: llega a tiempo y deja la mesa armada.
- Precio por persona claro: cotización transparente sin sorpresas.

## Capabilities and Constraints

- Canal de conversión único: WhatsApp (enlace `wa.me` con mensaje prellenado).
- Precios, textos de menú, zonas y número de WhatsApp viven en un solo archivo de configuración editable.
- Nombre confirmado: **Malhú** (tagline "Coffee break & Catering").
- **Abierto (sin confirmar):** ciudad (Perú, fuera de Lima; moneda S/), zonas de entrega, número de WhatsApp, horarios, redes sociales, formas de pago, pedido mínimo, anticipación mínima. Se usan marcadores claramente señalados hasta que el usuario los complete.

## Brand Commitments

- Logo confirmado: emblema ovalado con árbol, raíces y granos de café + wordmark "MALHÚ" y tagline "Coffee break & Catering", en crema sobre verde bosque `#395941`. Hoy se usa un PNG extraído de una captura (`public/img/logo-malhu*.png`, 473 px de ancho); **pedir el SVG original** para tamaños grandes.
- Color de marca: verde bosque `#395941` + crema. Debe convivir con la estética "gourmet oscuro" (el usuario pidió combinarlos).
- Prototipo de referencia del cliente: carrusel de inicio con 3 opciones, plato que gira al entrar, ingredientes en órbita y un brillo de color distinto por opción. Hay que superarlo, no copiarlo.
- Idioma: español (Perú). Tono: apetitoso, cálido, seguro; nunca genérico.
- Estética fijada por el usuario: "gourmet oscuro" (ver DESIGN / design-system/MASTER.md).

## Evidence on Hand

- El usuario tiene fotos propias de comida (fitness, bocaditos, platos variados) y un video corto opcional. **No usar stock ni inventar fotos**: marcadores diseñados con indicación de qué foto va.
- **Ausentes, no fabricar:** testimonios reales, número de eventos atendidos, clientes empresa, datos nutricionales, precios. Los testimonios se dejan como plantillas marcadas para reemplazar.

## Product Principles

1. Cada pantalla acerca a cotizar: la acción de WhatsApp siempre está a un gesto.
2. La comida es la protagonista; la interfaz se aparta.
3. Transparencia antes que adjetivos: precio por persona y qué incluye, a la vista.
4. Lo que no sabemos no se inventa (macros, testimonios, cifras).

## Accessibility & Inclusion

WCAG 2.2 AA: contraste ≥ 4.5:1, foco visible, teclado completo, etiquetas en formularios, alt descriptivo por foto, `prefers-reduced-motion` respetado con botón visible para pausar animaciones ambientales. Contenido completo legible sin JavaScript.
