# GRAYCRIS // Terminal Ejecutivo — WAYMAN

Tablet personal de Wayman (antagonista de *Diario de un Asesino Corporativo* /
Murderbot Diaries), empleado de la corporación GrayCris. Web de escritorio
ciberpunk-corporativo hecha en HTML + CSS + JS vanilla, sin frameworks ni
build tools: se abre `index.html` directamente en el navegador.

## Estructura de carpetas

```
wayman/
├── index.html      header / dock / board (board__grid + cards) / keyboard-zone / footer
├── styles.css      @font-face + paleta + diseño visual completo + responsive
├── script.js       Reloj corporativo + terminal de acceso + teclado virtual dividido
├── fonts/
│   └── AUTOMATRON_NUMBERSDEC.TTF   Tipografía decorativa "alienígena" (fuente global)
└── README.md       Este archivo (bitácora del proyecto)
```

## Estado actual — Fase 3: diseño visual + terminal/teclado a pantalla completa

- [x] Layout: header superior, dock lateral izquierdo, área central de
      tarjetas, **zona de teclado a todo lo ancho** y barra inferior de
      acciones (`.desktop` es ahora un grid de 4 filas).
- [x] `@font-face` de `AUTOMATRON_NUMBERSDEC.TTF` global; reloj corporativo
      real vía `script.js`; contenido completo de los 5 paneles + 4 botones
      (ver bitácora de la fase anterior más abajo en el historial de chat).
- [x] Paleta definitiva en `:root` (`--bg-void`, `--bg-panel`, `--accent-red`,
      `--accent-red-dim`, `--line`, `--glow`, + `--bg-panel-2`/`--accent-red-2`
      como variantes de apoyo). Tarjetas con forma de "ticket" (esquinas
      superiores cortadas vía `clip-path`), borde doble arriba/abajo, fondo
      rojo semitransparente. Fondo general con degradado radial + textura de
      ruido y scanlines sutiles (pseudo-elementos en `body`, sin imágenes).
      `--accent-red-dim` se aclaró un poco respecto al `~#a84a4a` sugerido
      para pasar contraste AA sobre el fondo de las tarjetas (~4.6:1).
- [x] Iconos del dock y placeholder del logo: hexágonos vía `clip-path` +
      `currentColor` (para que el hover cambie texto e icono a la vez).
- [x] **Terminal de acceso**: tarjeta agrandada (2 columnas × 2 filas del
      grid, ~700px de alto) dedicada solo a mostrar lo escrito, con prompt
      `wayman@graycris:~$`.
- [x] **Teclado virtual** (recompuesto una vez tras feedback — la v1 con
      hexágonos rotados no convencía): zona propia a todo lo ancho, debajo
      del área de tarjetas, dividida en mano izquierda / mano derecha. Cada
      mano se arma por **columnas de dedo** (1/Q/A/Z, 2/W/S/X...) en vez de
      filas, y cada columna lleva su propio desplazamiento vertical (la del
      dedo medio baja más que la del meñique) para imitar el escalonado real
      de un teclado ergonómico partido — sin rotar nada, a diferencia de la
      v1. Las teclas son paneles de "cristal" recortados en octágono (todas
      las esquinas cortadas, no hexágono), casi transparentes con su propio
      blur, y el borde luminoso se logra con `box-shadow` inset a 0 de blur
      (sigue el `clip-path` recortado; un `border`/`outline` normal no lo
      haría). Escribe tanto por clic en las teclas como por teclado físico
      (ver nota de accesibilidad más abajo), alimentando la terminal de arriba.
- [x] Responsive con **1340×800 como resolución de referencia** (estilos
      base) y breakpoints de 480px a 1600px+.
- [x] Verificado en un navegador real (Edge headless vía Playwright, no solo
      mirado en el editor): capturas de pantalla, bounding boxes de cada
      tarjeta para confirmar que no se solapan, y clics simulados en ambas
      manos del teclado para confirmar que el texto llega a la terminal.

## Dos bugs reales que aparecieron al verificar (y su arreglo)

- **Las tarjetas se solapaban entre sí.** `.board` hacía de scroll container
  *y* de grid con filas `auto` a la vez; al estar estirado por su padre a una
  altura fija, sus propias filas dejaban de medirse por el contenido de las
  tarjetas y se encogían al mínimo (160px), así que las tarjetas más altas
  desbordaban sobre las de la fila siguiente. Arreglo: separar las dos
  responsabilidades en dos elementos — `.board` (scroll, altura fija) por
  fuera y `.board__grid` (el grid de verdad) por dentro. Detalle en los
  comentarios de `index.html`/`styles.css` junto a `.board__grid`.
- **El teclado físico dejaba de escribir después de tocar cualquier tecla
  virtual.** El listener global de `keydown` ignoraba por completo cualquier
  tecla si el foco estaba sobre un `<button>` (para no disparar dos veces la
  acción de un botón enfocado por Tab+Enter/Espacio) — pero como un botón
  recién clicado se queda enfocado, esto bloqueaba también las letras
  normales. Arreglo en `script.js`: solo Enter/Espacio respetan el foco de un
  botón; el resto de teclas siempre escriben en la terminal.

## Pendiente (próximos pasos)

- [ ] Logo de GrayCris: el archivo compartido en el chat
      (`2ud_ViniloCorteBrillante-Pegatina_15x5,6cm_LogoRobot.pdf`) es un PDF
      vectorial, y un `<img>` no puede usarlo directamente. Cuando toque
      maquetar el logo hace falta exportarlo a SVG o PNG (por ejemplo a
      `img/logo-graycris.svg`) y sustituir el placeholder hexagonal actual.
- [ ] Interactividad: usar los `data-module` del dock, `data-panel` de las
      tarjetas y `data-action` de los botones para cablear selección de
      módulo activo, focus/expansión de tarjeta y acciones reales de consola
      (los puntos de extensión ya están comentados en `script.js`).
- [ ] Animaciones/efectos (glitch, glow pulsante, etc.) — de momento todo el
      diseño visual es estático, tal como se pidió.

## Notas técnicas

- La fuente original estaba en la raíz del proyecto como
  `AUTOMATRON NUMBERSDEC.TTF` (con espacio); la moví a
  `fonts/AUTOMATRON_NUMBERSDEC.TTF` (sin espacio) para que coincida con la
  estructura pedida y evitar problemas de espacios en la URL del `@font-face`.
- El layout es un grid de 4 filas (`header / body / keyboard-zone / footer`)
  y dentro de `body` otro grid de 2 columnas (`dock / board`). `.dock` y
  `.board` hacen scroll interno de forma independiente; el resto de la
  interfaz no se mueve. Como el teclado ahora ocupa una franja fija abajo,
  `.board` normalmente necesita scroll propio para ver las 6 tarjetas.
- Resolución de referencia: **1340×800** (tablet horizontal), que son los
  estilos base (sin media query). A partir de ahí hay una escalera de
  breakpoints: `1600px` (monitores grandes: limita el ancho de las tarjetas
  y centra el grid para que no queden gigantes/dispersas), `1024px` y
  `720px` (portátil / tablet vertical: dock más angosto, luego dock
  horizontal con scroll propio) y `480px` (móvil pequeño: una sola columna
  de tarjetas y el texto del header puede envolver en vez de recortarse).
  Los paddings/gaps usan `clamp()` para escalar de forma gradual entre
  breakpoints en lugar de saltar bruscamente.
- El HTML se escribe en mayúsculas/minúsculas "normales" en la mayoría de
  sitios (el aspecto en mayúsculas del dock y las etiquetas de estado se
  logra con `text-transform: uppercase` en CSS). Los títulos de cada tarjeta
  (`<h2>`) y algunos valores de estado (p. ej. "ACTIVA", "DESACTIVADO") se
  escriben ya en mayúsculas directamente en el HTML porque así los pasó el
  usuario entre comillas y todavía no existe una regla CSS de mayúsculas
  para `.card__title`/`.status__value` — se puede revisar cuando llegue la
  pasada de diseño final.

## Cómo ejecutarlo

No requiere instalación ni build. Basta con abrir `index.html` con doble clic
o arrastrarlo a una ventana del navegador.
