# CLAUDE.md — Web de catering "gourmet oscuro"

Reglas del proyecto para cualquier persona o agente que toque este código. Si una regla te estorba, cámbiala aquí primero; no la rompas en silencio.

- Sistema visual: `design-system/MASTER.md` (vinculante).
- Producto y lo que NO se inventa: `PRODUCT.md`.
- Plan de secciones y fotos: `docs/PLAN.md`.

## Stack (versiones exactas, sin `^` ni `~`)

<!-- VERSIONS:START -->
| Paquete | Versión | Publicada |
|---|---|---|
| next / eslint-config-next | 16.3.8 | 2026-09-30 |
| react / react-dom | 19.3.0 | 2026-09-09 |
| typescript | 5.9.3 | 2025-09-30 (se evita TS 6/7 por compatibilidad con el tooling de Next) |
| tailwindcss / @tailwindcss/postcss | 4.3.3 | 2026-07-16 |
| gsap | 3.15.0 | 2026-04-13 |
| @gsap/react | 2.1.2 | 2025-01-15 |
| lenis | 1.3.26 | 2026-08-05 |
| motion | 13.5.1 | 2026-10-02 (se evita la 14.0.0, recién salida) |
| matter-js / @types/matter-js | 0.20.0 / 0.20.2 | 2024-06-23 / 2025-09-20 |
| lucide-react | 1.49.0 | 2026-09-29 (v1 ya no trae íconos de marcas: redes y WhatsApp van como SVG propios en `components/ui/BrandIcons.tsx`) |
| eslint | 9.39.5 | 2026-07-10 |
| @types/node | 22.20.5 | 2026-10-01 (coincide con Node 22) |

Fase 5 añadirá `@playwright/test` 1.63.0 y `@axe-core/playwright` 4.13.0.

> Red: `registry.npmjs.org` corta la conexión en esta red; `.npmrc` apunta al espejo oficial `registry.yarnpkg.com` y fija `save-exact=true`. Si en tu red npmjs funciona, puedes borrar la línea `registry`.
<!-- VERSIONS:END -->

- Next.js App Router, `src/` dir, TypeScript `strict`, Tailwind v4 (tokens con `@theme` en `src/app/globals.css`).
- GSAP ≥ 3.13 incluye SplitText, CustomEase y ScrollTrigger gratis en el paquete `gsap`. Se registran **una sola vez** en `src/motion/gsap.ts`.
- `motion` se importa siempre desde `"motion/react"` (nunca `framer-motion`). Uso: pestañas, acordeón, cursor, `AnimatePresence` del ticket. GSAP: scroll, texto, parallax, pins.
- Three.js / R3F: **no se usa**. Solo se añade con una razón escrita aquí y carga diferida.

## Comandos

```bash
npm install          # instala dependencias exactas
npm run dev          # http://localhost:3000
npm run build && npm start
npm run lint
npm run typecheck    # tsc --noEmit
npm run test:e2e     # Playwright: capturas 375/768/1024/1440, consola, overflow, reduced-motion, axe
```

## Estructura de carpetas

```
src/
  app/                 layout.tsx (fuentes, metadatos, JSON-LD), page.tsx, globals.css, opengraph-image
  config/negocio.ts    ← ÚNICO archivo editable: nombre, WhatsApp, zonas, horarios, redes, menú, precios, FAQ, testimonios
  components/
    layout/            Navbar, Footer, MotionToggle (pausar animaciones)
    sections/          Hero, Lineas, Menus, AsiLlega, ComoFunciona, Cotizador, Galeria, MesaAntigravedad, Testimonios, FAQ, Contacto
    ui/                Button, Placeholder (marcador de foto), Ticket, Tabs, Field
  motion/              gsap.ts (registro + CustomEase), tokens.ts, SmoothScroll.tsx (Lenis), useReveal.ts, useSplitHeading.ts, ambient.ts
  lib/                 whatsapp.ts (arma el enlace wa.me), quote.ts (cálculo del estimado), seo.ts (LocalBusiness)
public/
  img/                 fotos del cliente (ver docs/PLAN.md § Fotos)
  frames/              secuencia "Así llega" (desktop/ y mobile/)
tests/e2e/             specs de Playwright
```

## Reglas de contenido

- **Todo texto, precio, plato, zona, número y horario sale de `src/config/negocio.ts`.** Nada de strings de negocio en los componentes.
- Nunca inventar: precios, macros/calorías, testimonios, cifras de clientes o eventos. Campos vacíos → no se muestran (o marcador visible "Por completar" solo en desarrollo).
- Nada de stock ni imágenes generadas. Si falta una foto: `<Placeholder foto="…" ratio="4:3" min="1600×1200" />`.
- Sin etiquetas/kickers sobre titulares ni números de sección decorativos: el titular se sostiene solo.
- Copy en español de Perú, apetitoso y concreto (ingredientes, texturas, temperatura). Prohibido: "experiencia única", "calidad premium", "sabores inigualables", lorem ipsum.
- `alt` describe el plato como lo diría un mozo: "Causa limeña de pollo con palta y huevo de codorniz", no "comida".

## Sistema de movimiento (vinculante)

### Tokens (`src/motion/tokens.ts` y `globals.css`)

| Token | Valor | Uso |
|---|---|---|
| `EASE` / `--ease-mesa` | `cubic-bezier(0.23, 1, 0.32, 1)` → `CustomEase.create("mesa", "0.23,1,0.32,1")` | **Única curva.** Entradas, salidas, hover, revelados, cursor. |
| `D1` / `--d-1` | `0.18s` | Micro: hover, press, foco, subrayado de pestañas, ícono del acordeón, salidas. |
| `D2` / `--d-2` | `0.6s` | Texto y entradas de elementos. |
| `D3` / `--d-3` | `1.0s` | Escenas: entrada del plato del hero, revelado de fotos de galería. |
| `STAGGER.words` | `0.04s` | Titulares divididos por palabra. |
| `STAGGER.lines` | `0.08s` | Titulares divididos por línea. |
| `STAGGER.items` | `0.06s` | Tarjetas y listas. |

Excepciones permitidas (no son curvas nuevas, son otro tipo de tiempo):
- **Scrub:** `ease: "none"`. El scroll es el tiempo; Lenis ya suaviza.
- **Deriva ambiental:** ruido continuo por frame (`gsap.ticker`), sin curva.
- **Física (Matter.js) y arrastre:** los gobierna la simulación.
- **Movimiento constante** (barra de progreso del carrusel, órbita lenta de los ingredientes): `ease: "none"`.
- **Carrusel del inicio:** avanza solo cada `hero.segundosPorOpcion` s; se pausa con el mouse encima, con foco dentro, fuera de pantalla, con la pestaña oculta y con "Pausar animaciones". Con movimiento reducido: sin avance automático, solo fundido.

### Propiedades

Solo `transform` (`x`, `y`, `xPercent`, `yPercent`, `scale`, `rotate`) y `opacity`/`autoAlpha`. Prohibido animar `width`, `height`, `top/left`, `margin`, `padding`, `filter`, `clip-path`, `box-shadow`, `background-position`. Los revelados de imagen se hacen con máscara: contenedor `overflow: hidden` + hijo `yPercent 100 → 0` e imagen `scale 1.15 → 1`.

### Jerarquía del texto (3 niveles, orden = orden de lectura)

Disparo: `ScrollTrigger start: "top 75%"`, `once: true`. Línea de tiempo por bloque:

| t | Elemento | Animación |
|---|---|---|
| 0.00 | **Titular** | SplitText `type: "lines"`, `mask: "lines"`, `yPercent 110→0`, D2, stagger lines 0.08 (o `words` 0.04 si es una sola línea) |
| 0.25 | **Subtítulo** | `autoAlpha 0→1`, `y 16→0`, D2 |
| 0.40 | **Apoyo** | `autoAlpha 0→1`, `y 8→0`, D2 |
| 0.50 | CTA | `autoAlpha 0→1`, `scale 0.96→1`, D2 |

Regla de legibilidad: `D2 + (n − 1) × stagger ≤ 1.0 s` → máx. 11 palabras o 5 líneas por titular. SplitText se crea con `autoSplit: true` y `onSplit` (re-divide en resize y tras cargar fuentes) y se revierte en el cleanup de `useGSAP`.

### Profundidad (parallax del hero, scrub)

Recorrido de `top top` a `bottom top` del hero. Desplazamiento `yPercent` por capa (más lejos = más lento):

| Capa | Factor | Nota |
|---|---|---|
| Pozo de luz / fondo | 0 | fijo |
| **Titular** | −8 | el más lento de lo que se mueve |
| Plato estrella | −14 | + `scale 1 → 0.92` |
| Ingredientes medios | −30 | |
| Ingredientes primer plano | −55 | + rotación extra según velocidad del scroll |

Móvil (< 768): solo titular + plato + 1 capa de ingredientes (5 piezas).

### Capítulos fijados (pin + scrub)

- "Así llega a tu mesa": `pin: true`, `end: "+=300%"` (móvil `+=200%`), `scrub: 0.5`. Cuatro subtítulos-capítulo (Cocinamos · Emplatamos · Viaja · Servido) cambian en los umbrales 0/25/50/75 % con `autoAlpha` + `y 16`. Un mensaje por pantalla.
- Cada pin usa `anticipatePin: 1` e `invalidateOnRefresh: true`.

### Ambiente (hero e ingredientes)

- Deriva: cada pieza con semilla propia, ±12 px en x/y y ±8° de rotación, período 6–10 s, por ruido continuo.
- Cursor: repulsión suave hasta 24 px con `gsap.quickTo(el, "x", { duration: D2, ease: "mesa" })`.
- Scroll: la velocidad (`ScrollTrigger.getVelocity`) suma un impulso de rotación que decae.
- Todo se pausa fuera de pantalla (`ScrollTrigger onToggle`) y con la pestaña oculta (`visibilitychange`).

### Microinteracciones

- Botones: `:active { transform: scale(0.97) }` D1; hover (solo `@media (hover:hover) and (pointer:fine)`): fondo `--azafran-hover` y flecha `x +4px`, D1.
- Tarjetas: hover → foto `scale 1.04` en D2, precio "desde" `autoAlpha` + `y 8→0` en D1.
- Enlaces: subrayado `scaleX 0→1` con `transform-origin: left`, D1.
- Cursor (solo puntero fino): punto 8 px (quickTo D1) + anillo 36 px (quickTo D2); crece a 64 px con etiqueta mono sobre fotos ("Ver") y en la Mesa ("Arrastra"). El cursor nativo **no** se oculta.
- Nunca animar acciones iniciadas por teclado (cambio de pestaña con flechas, abrir acordeón con Enter): cambian al instante o en D1 como máximo.

### Movimiento reducido y pausa

- Todo el movimiento vive dentro de `gsap.matchMedia()` con `"(prefers-reduced-motion: no-preference)"`. En `reduce`: sin Lenis, sin pins ni scrub, sin parallax, sin deriva, sin física; los textos aparecen ya en su estado final; "Así llega" muestra el último frame + los 4 capítulos como lista; la Mesa muestra los platos en rejilla estática con botones.
- Botón visible "Pausar animaciones" (`MotionToggle`, en la navbar): pausa deriva, física, cursor y marquesinas; recuerda la preferencia en `localStorage` (con try/catch).

### Sin JavaScript

- El HTML del servidor muestra **todo** el contenido en su estado final. Los estados iniciales ocultos solo los pone GSAP en el cliente (`gsap.from` dentro de `useGSAP`).
- Para evitar el destello: un script inline en `<head>` añade `html.js`; el CSS oculta `[data-reveal]` solo bajo `html.js`. Si en 2.5 s no se marcó `window.__motionReady`, se quita la clase (falla segura).
- La imagen del hero (LCP) **nunca** empieza oculta: solo anima `transform`.

### Scroll suave (Lenis + GSAP)

```ts
const lenis = new Lenis({ lerp: 0.1, autoRaf: false });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

Enlaces internos → `lenis.scrollTo(target, { offset: -altoNavbar })`. Lenis se destruye en el cleanup y no se crea con movimiento reducido.

## Rendimiento

- LCP < 2.5 s en móvil. Hero: `next/image` con `priority`, `fetchPriority="high"`, sin lazy, `sizes` exactos.
- `next.config`: `images.formats = ["image/avif", "image/webp"]`.
- Canvas de frames, Matter.js y la galería: `dynamic(() => import(...), { ssr: false })` + montaje al acercarse (IntersectionObserver, `rootMargin: "50% 0px"`); se pausan fuera de pantalla.
- Frames: desktop 120 × 1280 px WebP; móvil 60 × 720 px WebP. Precarga progresiva: primero cada 8.º frame, luego el resto.
- Física: desktop 16 cuerpos, móvil 8.
- Fuentes: `next/font` con `display: "swap"` y fallbacks ajustados.

## Accesibilidad

- Contraste ≥ 4.5:1 (ver tabla en MASTER.md). Foco visible siempre (`:focus-visible`).
- Teclado: pestañas con flechas (patrón ARIA tabs), acordeón nativo `<details>`, la Mesa operable con Tab + Enter (cada cuerpo tiene un botón equivalente).
- Formularios: `<label>` visible, `aria-describedby` para errores, validación al enviar y al salir del campo.
- Un solo `<h1>`. Secciones con `aria-labelledby`. Enlace "Saltar al contenido".

## Convenciones de código

- Componentes en PascalCase, un componente por archivo. Secciones = Server Components; solo lo animado es `"use client"`.
- Hooks de animación siempre con `useGSAP({ scope })` para limpieza automática.
- Clases de Tailwind usando tokens (`bg-carbon`, `text-crema`, `text-azafran`); nunca hex sueltos en componentes.
- Commits en español, en imperativo: "Agrega cotizador", "Corrige foco en pestañas".
