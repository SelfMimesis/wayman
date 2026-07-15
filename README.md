# GRAYCRIS // Terminal Ejecutivo — WAYMAN

Tablet personal de Wayman (antagonista de *Diario de un Asesino Corporativo* /
Murderbot Diaries), empleado de la corporación GrayCris. Web de escritorio
ciberpunk-corporativo hecha en HTML + CSS + JS vanilla, sin frameworks ni
build tools: se abre `index.html` directamente en el navegador.

## Estructura de carpetas

```
wayman/
├── index.html      header / body (dock + board, con keyboard-zone superpuesta) / footer
├── styles.css      @font-face + paleta + diseño visual completo + animaciones + responsive
├── script.js       Reloj + terminal (con efecto matrix) + teclado virtual + taskbar
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
- [x] **Modo kiosco**: el primer toque/clic en cualquier parte de la página
      entra en pantalla completa (Fullscreen API); si en algún momento se
      sale, el siguiente toque vuelve a entrar. Importante: esto no bloquea
      la tecla Escape ni los gestos del sistema — los navegadores reservan
      esa salida siempre, como medida de seguridad que una página no puede
      desactivar (para que ningún sitio pueda dejar a alguien atrapado en
      pantalla completa). Lo que sí garantiza es que ningún toque sobre la
      propia interfaz saca de pantalla completa.
- [x] Responsive con **1340×800 como resolución de referencia** (estilos
      base) y breakpoints de 480px a 1600px+.
- [x] **Animaciones ambientales**, todas solo con `transform`/`opacity`
      (nunca `box-shadow`/`filter`/color en `@keyframes`, para que corran en
      el compositor sin disparar layout/paint por frame):
      - Pulso lento de opacidad (0.85–1) en los 6 títulos de tarjeta y en
        "Conexión segura: ACTIVA", cada uno con su propia duración/retardo
        (vía `nth-child`) para que no parpadeen en fase.
      - Respiración (`translateY` de 1-2px) en los 5 iconos del dock, en
        bucle, también con duración/retardo distintos por icono.
      - Reloj corporativo: ahora se actualiza cada minuto (formato `HH:MM`,
        ya sin segundos) en vez de cada segundo, comprobando el `Date` cada
        segundo pero solo tocando el DOM cuando el minuto cambia de verdad
        (evita el drift de un `setInterval` a 60000ms puro), con un fade
        corto al cambiar.
      - Máquina de escribir (JS, no CSS puro) en la carga inicial para
        "Buen día, director." y el texto de ALERTA DE SEGURIDAD, con un
        delay por carácter ligeramente aleatorio y pausas extra en
        puntuación para que no se sienta mecánico.
      - Glitch de aberración cromática (dos capas de color vía
        `content: attr(data-glitch)` en `::before`/`::after`) que se
        dispara solo, cada 8-15s (intervalo aleatorio real, no un
        `@keyframes` en bucle fijo), únicamente en el título de ALERTA DE
        SEGURIDAD.
      - Todo se desactiva con `prefers-reduced-motion`: lo CSS vía un
        `@media` global al final de `styles.css`; lo que corre en JS
        (máquina de escribir, disparo del glitch) tiene su propio chequeo
        de `matchMedia`, porque esa media query no afecta a temporizadores
        de JavaScript.
- [x] Verificado en un navegador real (Edge headless vía Playwright, no solo
      mirado en el editor): capturas de pantalla, bounding boxes de cada
      tarjeta para confirmar que no se solapan, clics simulados en ambas
      manos del teclado para confirmar que el texto llega a la terminal, y
      para las animaciones — progreso de la máquina de escribir muestreado
      en el tiempo, opacidad/transform de los pulsos muestreados en dos
      instantes para confirmar que sí progresan, un disparo real del glitch
      aleatorio capturado dentro de la ventana de 8-15s, y los tres (pulso,
      respiración, máquina de escribir) verificados también con
      `prefers-reduced-motion` emulado para confirmar que se desactivan.

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
- [ ] Interactividad del **dock** y las **tarjetas** (selección de módulo
      activo, focus/expansión) — sigue pendiente, punto de extensión
      comentado en `script.js`. La de la **taskbar** ya está resuelta (ver
      abajo).

## Interactividad de la taskbar (los 4 botones inferiores)

- [x] Un solo listener de clic **delegado en `.taskbar`** (no uno por
      botón) — confirmado leyendo el propio código: solo hay un
      `addEventListener('click', ...)` sobre el contenedor.
- [x] Hover: puro CSS (`:hover`, sin JS) — borde y texto pasan a
      `--accent-red` con `box-shadow` de glow, más `transform: scale(1.02)`,
      transición de 180ms `ease-out`.
- [x] Clic → ripple: un `<span class="ripple">` se crea en el punto exacto
      del clic (ancho/alto/posición van por fuerza en `style` inline, porque
      dependen de la coordenada real; el efecto en sí —color, escala,
      desvanecido— es CSS/`@keyframes`) y se borra solo del DOM al terminar
      su animación (`animationend`, con un `setTimeout` de red por si ese
      evento no llegara). Clics rápidos repetidos generan varios ripples
      independientes que conviven y se limpian cada uno por su cuenta, sin
      acumularse.
- [x] Tras el ripple, según `data-action`: los tres primeros botones
      muestran una frase en `#system-log` (una cajita que flota justo
      encima de la taskbar, fade+slide de 250ms) que se autodesvanece a los
      4.5s — y si llega otro clic antes de que desaparezca, el temporizador
      se cancela y se reinicia limpio con el mensaje nuevo, sin parpadeos.
      "Bloquear terminal" en cambio abre `#lock-overlay`: overlay de
      pantalla completa con blur fuerte del fondo, el hexágono del logo,
      "Terminal bloqueado — Acceso restringido" (con el mismo `pulse-glow`
      de los títulos de tarjeta) y un botón "Reactivar sesión" que lo
      cierra. Mientras está abierto, el teclado físico deja de escribir en
      la terminal (chequeo añadido al `keydown` existente) y los clics no
      llegan a nada de detrás (el overlay los intercepta).
- [x] Verificado en navegador real: transform en hover, conteo de nodos
      `.ripple` en el DOM antes/después de la animación y tras una ráfaga de
      5 clics seguidos (confirma que no se acumulan), el mensaje cambiando
      correctamente al clicar otro botón antes de que desaparezca el
      anterior, el auto-ocultado a los ~4.5s, y en el overlay: el foco
      moviéndose al botón de reactivar, la terminal ignorando tecleo físico
      mientras está bloqueada, un clic a una tecla del teclado virtual de
      abajo sin efecto mientras el overlay está encima, y que todo vuelve a
      funcionar tras reactivar.

## Auditoría completa del proyecto

Revisión de `index.html` + `styles.css` + `script.js` completos (no solo lo
último tocado), con dos bugs reales encontrados y arreglados:

- **Fix — dead space enorme en monitores grandes (1920×1080, 2560×1440).**
  El breakpoint `@media (min-width: 1600px)` limitaba las tarjetas a un
  ancho máximo fijo (340px) con `auto-fit`. Con más ancho disponible del que
  hacía falta para las tarjetas existentes, `auto-fit` seguía calculando una
  columna "de más" que colapsaba a 0px pero ya había empujado el reparto del
  espacio sobrante a `justify-content: center` — verificado en 2560px de
  ancho: ~590px muertos a cada lado. Arreglo: igual que el resto de
  breakpoints, usar `minmax(360px, 1fr)` (las columnas absorben el espacio
  en vez de dejarlo como margen) y hacer que la terminal ocupe más columnas
  (`span 3` en vez de `span 2`, ya sin necesitar 2 filas) para aprovechar
  mejor el ancho de sobra. Confirmado: en 1920×1080 ya no queda espacio
  muerto (la fila de la terminal queda completa junto con "Nota"); en
  2560×1440 el hueco que queda es mucho más modesto y se lee como diseño
  intencional, no como un bug.
- **Fix — el `@media (prefers-reduced-motion: reduce)` no estaba realmente
  al final del archivo**, pese a que el propio comentario lo decía: quedó
  encajado entre los breakpoints de 720px y 480px por un `Edit` mal
  apuntado en una pasada anterior. No causaba ningún bug funcional (usa
  `!important`, que gana pase lo que pase el orden), pero sí hacía el
  archivo más confuso de seguir. Movido al final de verdad.
- **Sin animaciones duplicadas ni listeners huérfanos.** Las 5
  `@keyframes` (`pulse-glow`, `breathe`, `glitch-shift-a/b`,
  `ripple-expand`) tienen nombres únicos; cada listener (`click` delegado
  en `.taskbar`, `keydown` de la terminal, `click`/`touchstart` del
  fullscreen, uno por tecla del teclado virtual) se registra una sola vez
  al cargar el script, sin bucles que los re-adjunten.
- **Sin `requestAnimationFrame` en ningún sitio** (todo lo ambiental es CSS
  puro, corre en el compositor). El único `setInterval` (el reloj) no tiene
  ningún escenario de limpieza pendiente porque nada en la app recrea
  elementos ni reinicia el script — vive mientras viva la página, que es lo
  correcto para un reloj. Los `setTimeout` (fade del reloj, máquina de
  escribir, glitch, ripple, log de sistema) o bien terminan solos
  (recursión que para cuando ya no hay más texto/no hay reduced-motion) o
  bien cancelan explícitamente el anterior antes de programar uno nuevo
  (`logHideTimer` en el log de sistema) — no hay timers huérfanos.
- **Fuente verificada de verdad, no solo leída en el CSS**: con
  `document.fonts` confirmé que `Automatron` carga (`status: "loaded"`) y
  que el `font-family` computado incluye el fallback
  (`Automatron, "Courier New", monospace`); además bloqueé a propósito la
  petición del `.ttf` para simular un fallo de carga y confirmé que el
  texto se sigue viendo bien con la fuente de respaldo monoespaciada.

## Teclado superpuesto + más animación ambiental + optimización

- [x] **Teclado superpuesto sobre el board** en vez de tener su propia fila:
      comparte celda de grid con `.board` (`align-self: end`, más bajo que
      antes), con un margen lateral/inferior para que las tarjetas se vean
      alrededor y a través del cristal en los bordes. Bug real encontrado al
      hacerlo: si solo el teclado tiene `grid-column`/`grid-row` explícitos,
      el grid trata esa celda como reservada y `.board` (sin posición
      explícita) se auto-coloca en una fila nueva para "evitarla" en vez de
      compartirla — hubo que hacer explícitas también `.dock` y `.board`.
- [x] **Círculo central del teclado, ahora totalmente opaco** (antes era un
      aro de cristal translúcido): degradado con colores 100% opacos, sin
      canal alfa, y sin `backdrop-filter` (que ya no tenía sentido — no hay
      nada "detrás" que se pueda ver a través de una superficie opaca).
- [x] **Gráfico animado tipo bolsa** en el hueco que quedaba vacío bajo la
      lista de métricas de INDICADORES CORPORATIVOS: línea de precio en SVG
      (con relleno degradado debajo), un barrido de luz cruzándola cada 5s
      (mismo truco de `translateX` que el pulso de circuito) y una mini
      barra de "volumen" con 6 barras en bucle escalonado.
- [x] Animaciones ambientales nuevas, todas en bucle:
      - **Pulso de circuito**: una chispa recorre la línea divisoria del
        header y del footer de punta a punta (`translateX` de -100% a 500%
        del propio ancho del elemento — así con un `width:20%` cruza todo
        el contenedor sin animar `left`, que dispara layout).
      - **Neón + flotación en las 44 teclas**: cada tecla respira en
        opacidad (`pulse-glow`) y su letra flota un par de px
        (`breathe`) — desfasado por columna vía una custom property
        heredada (`--key-delay`; `animation-delay` normal no hereda,
        las custom properties sí).
      - **Popup al pulsar una tecla**: aparece el carácter en grande justo
        encima, con fade+scale, y se borra solo del DOM — igual que el
        ripple de la taskbar. También se dispara al escribir con el
        teclado físico (busca la tecla virtual equivalente por carácter).
      - **Efecto "matrix" al escribir en la terminal**: el último carácter
        cicla 4 veces por glifos aleatorios (katakana, símbolos, letras)
        antes de asentarse en el real; con `decodeToken` para invalidar
        limpiamente un ciclo anterior si se teclea de nuevo antes de que
        termine (no se pisan/acumulan si se escribe rápido). Color rojo de
        la app, no verde — por mantener la paleta, no la referencia literal.
- [x] **Bug real encontrado al verificar**: la animación de "flotación"
      (`breathe`, `translateY`) estaba puesta directamente en el `<button>`
      de cada tecla. Playwright se negaba a hacer clic ("element is not
      stable") porque el botón nunca dejaba de moverse — el mismo problema
      afecta a un dedo/ratón real apuntando a un objetivo que no para quieto.
      Arreglo: la letra vive en un `<span>` interno que es el que flota; el
      `<button>` (la zona clicable) ya no se mueve nunca.
- [x] **Pasada de rendimiento** (a raíz de pedir "animaciones muy fluidas"):
      - `backdrop-filter` en las 44 teclas + el círculo central eliminado:
        es de las propiedades más caras para la GPU, y tenerla en 44
        elementos a la vez (con `pulse-glow` corriendo en todos) era el
        cuello de botella más grande de la interfaz. La zona del teclado ya
        pone su propio `backdrop-filter` de conjunto; no hacía falta
        repetirlo por tecla. Confirmado con
        `getComputedStyle().backdropFilter` sobre todos los elementos:
        46 → 2.
      - `will-change` quitado de las 44 teclas + sus 44 `<span>` de letra:
        88 hints explícitos pidiendo capas de composición persistentes es
        demasiado ("moderación", como se pidió hace unas cuantas vueltas)
        para animaciones tan simples que el navegador ya promociona bien
        por su cuenta. Confirmado: ~102 → 12 elementos con `will-change`
        activo (los que quedan: 6 títulos de tarjeta, 1 indicador de
        conexión, 5 iconos del dock).
      - Scanlines: quitado el `mix-blend-mode: overlay` — un blend-mode
        obliga a recomponer ese overlay de pantalla completa cada vez que
        algo cambia debajo, y con tantas animaciones en bucle nuevas eso es
        constantemente. Ahora son líneas oscuras simples sin blend (además
        más parecido a como se ven en la práctica los huecos entre líneas
        de barrido de un CRT real).
- [x] Todo lo anterior verificado en navegador real: layout del teclado
      compartiendo celda con el board (antes/después del bug del grid),
      clic estable en las teclas (antes fallaba con "element is not
      stable", ahora no), el efecto matrix capturado en pleno ciclo
      (`1` → `1V` → `1キ` → `1イ` → `1y`), tecleo rápido cruzando ambas
      manos sin corrupción, y los contadores de `backdrop-filter`/
      `will-change` antes/después de la pasada de rendimiento.

## Notas técnicas

- La fuente original estaba en la raíz del proyecto como
  `AUTOMATRON NUMBERSDEC.TTF` (con espacio); la moví a
  `fonts/AUTOMATRON_NUMBERSDEC.TTF` (sin espacio) para que coincida con la
  estructura pedida y evitar problemas de espacios en la URL del `@font-face`.
- El layout es un grid de 3 filas (`header / body / footer`) y dentro de
  `body` otro grid de 2 columnas (`dock / board`). `.keyboard-zone` NO tiene
  fila propia: comparte celda (`grid-column`/`grid-row` explícitos) con
  `.board` y se pega abajo con `align-self: end`, flotando por encima en vez
  de empujarlo — por eso `.dock`/`.board`/`.keyboard-zone` los tres llevan
  `grid-column`/`grid-row` explícitos (si solo el teclado los tuviera, el
  grid trataría esa celda como "ocupada" y desviaría a `.board` a una fila
  nueva en vez de dejarlo compartirla — pasó, se verificó y se arregló).
  `.dock` y `.board` hacen scroll interno de forma independiente; el resto
  de la interfaz no se mueve.
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
