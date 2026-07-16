// ============================================================================
// GRAYCRIS CORPORATION — Terminal ejecutivo (WAYMAN)
// script.js
//
// Reloj corporativo + terminal de acceso con teclado virtual. El resto de
// interactividad (selección de módulo en el dock, acciones de la barra
// inferior) sigue pendiente — puntos de extensión comentados más abajo.
// ============================================================================

(function () {
  'use strict';

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  const clockEl = document.getElementById('corporate-clock');

  // Se comprueba cada segundo pero solo se toca el DOM (y se dispara el
  // fade) cuando el minuto realmente cambia: evita escrituras redundantes
  // y evita el drift que tendría un setInterval a 60000ms puro.
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const next = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (clockEl.textContent === next) return;

    if (prefersReducedMotion()) {
      clockEl.textContent = next;
      return;
    }

    clockEl.style.opacity = '0';
    setTimeout(() => {
      clockEl.textContent = next;
      clockEl.style.opacity = '1';
    }, 300);
  }

  updateClock();
  setInterval(updateClock, 1000);

  // --------------------------------------------------------------------
  // Pantalla completa: el primer toque/clic entra en fullscreen. Tocar el
  // contenido de la página nunca saca de fullscreen (así se comportan los
  // navegadores por defecto), así que no hace falta bloquear nada ahí. Si
  // en algún momento se sale de fullscreen, el siguiente toque vuelve a
  // entrar automáticamente.
  //
  // Límite real, no de este código: los navegadores reservan la tecla
  // Escape (y algunos gestos del sistema) para salir de fullscreen SIEMPRE
  // — es una medida de seguridad que una página no puede desactivar, para
  // que ningún sitio pueda dejar a alguien atrapado en pantalla completa.
  // Por eso esto garantiza "no se sale tocando nada", no "no se sale de
  // ninguna forma".
  // --------------------------------------------------------------------
  function enterFullscreen() {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  document.addEventListener('click', enterFullscreen);
  document.addEventListener('touchstart', enterFullscreen, { passive: true });

  // --------------------------------------------------------------------
  // Animaciones ambientales controladas por JS (máquina de escribir +
  // glitch aleatorio). El pulso de los títulos, la respiración del dock y
  // el fade del reloj son puro CSS (@keyframes/transition en styles.css);
  // esto es lo único que necesita temporizadores de JS, para controlar la
  // velocidad por carácter y el intervalo aleatorio del glitch.
  // --------------------------------------------------------------------

  // Máquina de escribir, solo en la carga inicial. El delay por carácter
  // lleva algo de aleatoriedad (y una pausa extra en puntuación) para que
  // no se sienta perfectamente mecánico.
  function typewriter(el) {
    if (!el) return;
    if (prefersReducedMotion()) return; // se deja el texto completo tal cual

    const fullText = el.textContent;
    el.textContent = '';
    let i = 0;

    function step() {
      if (i >= fullText.length) return;
      const char = fullText[i];
      el.textContent += char;
      i++;
      let delay = 28 + Math.random() * 35;
      if (',;'.includes(char)) delay += 120;
      if ('.!?'.includes(char)) delay += 220;
      setTimeout(step, delay);
    }

    step();
  }

  typewriter(document.querySelector('.brand__greeting'));
  typewriter(document.querySelector('[data-panel="alerta"] .card__body'));

  // Glitch aleatorio (cada 8-15s) solo en el panel de ALERTA DE SEGURIDAD.
  // .is-glitching dispara las capas de aberración cromática ya definidas en
  // styles.css (::before/::after con content: attr(data-glitch)).
  function scheduleGlitch(card) {
    if (!card || prefersReducedMotion()) return;
    const delay = 8000 + Math.random() * 7000;
    setTimeout(() => {
      card.classList.add('is-glitching');
      setTimeout(() => card.classList.remove('is-glitching'), 450);
      scheduleGlitch(card);
    }, delay);
  }

  scheduleGlitch(document.querySelector('[data-panel="alerta"]'));

  // --------------------------------------------------------------------
  // Controlled circle packing del canal central del teclado. Los círculos
  // parten cerca del centro y una relajación iterativa aplica fuerzas de
  // separación hasta que dejan de solaparse, siguiendo el planteamiento
  // del tutorial de CodePlastic adaptado de Processing a Canvas 2D.
  // --------------------------------------------------------------------
  const packingCanvas = document.getElementById('keyboard-packing');

  if (packingCanvas) {
    const packingCtx = packingCanvas.getContext('2d', { alpha: true });
    let packingWidth = 0;
    let packingHeight = 0;
    let packedCircles = [];
    let packingFrame = 0;
    let packingLastFrame = 0;

    function createPackedCircles() {
      const area = packingWidth * packingHeight;
      const count = Math.max(14, Math.min(34, Math.round(area / 2600)));
      const minRadius = Math.max(4, Math.min(packingWidth, packingHeight) * 0.025);
      const maxRadius = Math.max(11, Math.min(packingWidth, packingHeight) * 0.105);

      packedCircles = Array.from({ length: count }, (_, index) => ({
        x: packingWidth / 2 + (Math.random() - 0.5) * 12,
        y: packingHeight / 2 + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: minRadius + Math.random() * (maxRadius - minRadius),
        phase: Math.random() * Math.PI * 2,
        cutout: index % 3 !== 0,
      }));

      // Relajación rápida previa: evita mostrar el estado inicial apilado.
      for (let iteration = 0; iteration < 180; iteration++) {
        let overlaps = 0;
        for (let i = 0; i < packedCircles.length; i++) {
          const a = packedCircles[i];
          let forceX = 0;
          let forceY = 0;
          for (let j = 0; j < packedCircles.length; j++) {
            if (i === j) continue;
            const b = packedCircles[j];
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            let distance = Math.hypot(dx, dy);
            const minimum = a.radius + b.radius + 2;
            if (distance < minimum) {
              overlaps++;
              if (distance < 0.01) {
                dx = Math.random() - 0.5;
                dy = Math.random() - 0.5;
                distance = Math.hypot(dx, dy);
              }
              const push = (minimum - distance) * 0.055;
              forceX += (dx / distance) * push;
              forceY += (dy / distance) * push;
            }
          }
          a.vx = (a.vx + forceX) * 0.82;
          a.vy = (a.vy + forceY) * 0.82;
          a.x += a.vx;
          a.y += a.vy;
          a.x = Math.max(a.radius + 3, Math.min(packingWidth - a.radius - 3, a.x));
          a.y = Math.max(a.radius + 3, Math.min(packingHeight - a.radius - 3, a.y));
        }
        if (!overlaps) break;
      }
    }

    function resizePacking() {
      const rect = packingCanvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      packingWidth = Math.max(1, Math.round(rect.width));
      packingHeight = Math.max(1, Math.round(rect.height));
      packingCanvas.width = Math.round(packingWidth * ratio);
      packingCanvas.height = Math.round(packingHeight * ratio);
      packingCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
      createPackedCircles();
    }

    function drawPacking(time) {
      const reduced = prefersReducedMotion();
      if (!reduced && time - packingLastFrame < 55) {
        packingFrame = requestAnimationFrame(drawPacking);
        return;
      }
      packingLastFrame = time;
      const t = reduced ? 0 : time * 0.001;

      packingCtx.clearRect(0, 0, packingWidth, packingHeight);
      packingCtx.fillStyle = 'rgba(48, 12, 15, 0.42)';
      packingCtx.fillRect(0, 0, packingWidth, packingHeight);

      // Los cutouts borran la veladura del propio canvas: a través de ellos
      // reaparece el fondo de cristal más transparente de keyboard-zone.
      packingCtx.save();
      packingCtx.globalCompositeOperation = 'destination-out';
      packedCircles.filter((circle) => circle.cutout).forEach((circle) => {
        const radius = circle.radius * (1 + Math.sin(t * 0.65 + circle.phase) * 0.035);
        packingCtx.beginPath();
        packingCtx.arc(circle.x, circle.y, radius, 0, Math.PI * 2);
        packingCtx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        packingCtx.fill();
      });
      packingCtx.restore();

      packedCircles.forEach((circle, index) => {
        const pulse = 1 + Math.sin(t * 0.8 + circle.phase) * 0.04;
        const radius = circle.radius * pulse;
        packingCtx.beginPath();
        packingCtx.arc(circle.x, circle.y, radius, 0, Math.PI * 2);
        packingCtx.lineWidth = circle.cutout ? 0.8 : 1.4;
        packingCtx.strokeStyle = circle.cutout
          ? 'rgba(255, 90, 90, 0.38)'
          : `rgba(255, 43, 43, ${0.68 + Math.sin(t + index) * 0.16})`;
        packingCtx.shadowColor = circle.cutout ? 'transparent' : 'rgba(255, 43, 43, 0.9)';
        packingCtx.shadowBlur = circle.cutout ? 0 : 7;
        packingCtx.stroke();

        if (!circle.cutout && radius > 10) {
          packingCtx.beginPath();
          packingCtx.arc(circle.x, circle.y, radius * 0.72, 0, Math.PI * 2);
          packingCtx.lineWidth = 0.55;
          packingCtx.strokeStyle = 'rgba(255, 100, 100, 0.22)';
          packingCtx.shadowBlur = 2;
          packingCtx.stroke();
        }
      });
      packingCtx.shadowBlur = 0;

      if (!reduced) packingFrame = requestAnimationFrame(drawPacking);
    }

    const packingResizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(packingFrame);
      resizePacking();
      drawPacking(performance.now() + 100);
    });
    packingResizeObserver.observe(packingCanvas);
    resizePacking();
    drawPacking(100);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(packingFrame);
      else if (!prefersReducedMotion()) packingFrame = requestAnimationFrame(drawPacking);
    });
  }

  // --------------------------------------------------------------------
  // Telemetría ASCII procedural. Como en el shader de referencia, cada
  // celda muestrea un valor de luminosidad y lo convierte a un carácter.
  // Aquí Canvas 2D mantiene el proyecto autocontenido y permite combinar
  // radar, onda, histograma y ruido sin cargar OGL ni exigir Vite.
  // --------------------------------------------------------------------
  const asciiCanvas = document.getElementById('ascii-telemetry-canvas');
  const MATRIX_GLYPHS = '01アイウエオカキクケコサシスセソABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&*+-<>/\\|';
  let asciiInputImpulse = 0;
  let asciiInputSeed = 0;
  let asciiInputCount = 0;
  let matrixRunToken = 0;
  const matrixOriginals = new Map();

  function restoreMatrixText() {
    matrixOriginals.forEach((original, node) => {
      if (node.isConnected) node.nodeValue = original;
      node.parentElement?.classList.remove('is-matrix-decoding');
    });
    matrixOriginals.clear();
  }

  function triggerInterfaceMatrix() {
    if (prefersReducedMotion()) return;
    const token = ++matrixRunToken;
    restoreMatrixText();

    const roots = document.querySelectorAll([
      '.brand__text', '.header__status', '.dock__label', '.card__title',
      '.card__meta', '.card__body', '.card__list', '.card__quote',
      '.taskbar__button', '.ascii-telemetry__header'
    ].join(','));
    const nodes = [];

    roots.forEach((root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.trim()) nodes.push(node);
      }
    });

    // Se altera una muestra distinta en cada pulsación para crear una onda
    // distribuida, legible y barata; nunca se destruye el marcado interno.
    nodes.sort(() => Math.random() - 0.5).slice(0, Math.max(5, Math.ceil(nodes.length * 0.34))).forEach((node) => {
      matrixOriginals.set(node, node.nodeValue);
      node.parentElement?.classList.add('is-matrix-decoding');
    });

    let tick = 0;
    function decodeTick() {
      if (token !== matrixRunToken) return;
      if (tick >= 3) {
        restoreMatrixText();
        return;
      }
      matrixOriginals.forEach((original, node) => {
        node.nodeValue = [...original].map((char) => {
          if (/\s/.test(char) || Math.random() > 0.28) return char;
          return MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];
        }).join('');
      });
      tick++;
      setTimeout(decodeTick, 42);
    }
    decodeTick();
  }

  function reactToTerminalInput(char) {
    asciiInputCount++;
    asciiInputSeed = (asciiInputSeed * 33 + String(char).charCodeAt(0)) % 997;
    asciiInputImpulse = Math.min(1, asciiInputImpulse + 0.3);
    triggerInterfaceMatrix();
  }

  if (asciiCanvas) {
    const ctx = asciiCanvas.getContext('2d', { alpha: true });
    const chars = ' .·:+=*#%@';
    let width = 0;
    let height = 0;
    let lastFrame = 0;
    let animationFrame = 0;

    function resizeAsciiTelemetry() {
      const rect = asciiCanvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      asciiCanvas.width = Math.round(width * ratio);
      asciiCanvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function hashNoise(x, y, phase) {
      return (Math.sin(x * 12.9898 + y * 78.233 + phase * 0.37) * 43758.5453) % 1;
    }

    function drawAsciiTelemetry(time) {
      const reduced = prefersReducedMotion();
      if (!reduced && time - lastFrame < 90) {
        animationFrame = requestAnimationFrame(drawAsciiTelemetry);
        return;
      }
      lastFrame = time;

      const t = reduced ? 2.4 + asciiInputSeed * 0.001 : time * (0.00032 + asciiInputImpulse * 0.0003);
      const cellW = width < 250 ? 8 : 9;
      const cellH = 10;
      const cols = Math.ceil(width / cellW);
      const rows = Math.ceil(height / cellH);
      const radarX = 0.5;
      const radarY = 0.42;
      const sweep = t * 2.1;

      ctx.clearRect(0, 0, width, height);
      ctx.font = `bold ${Math.max(7, cellW - 1)}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let row = 3; row < rows - 3; row++) {
        for (let col = 0; col < cols; col++) {
          const u = (col + 0.5) / cols;
          const v = (row + 0.5) / rows;
          const dx = (u - radarX) * 1.65;
          const dy = v - radarY;
          const radius = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);

          const ringFrequency = 7.5 + asciiInputImpulse * 8 + (asciiInputSeed % 5) * 0.18;
          const ring = Math.max(0, 1 - Math.abs(((radius * ringFrequency) % 1) - 0.5) * 15);
          const crosshair = Math.max(0, 1 - Math.min(Math.abs(dx), Math.abs(dy)) * 90) * (radius < 0.38 ? 0.5 : 0);
          const sweepDelta = Math.abs(Math.atan2(Math.sin(angle - sweep), Math.cos(angle - sweep)));
          const radarBeam = Math.max(0, 1 - sweepDelta * 8) * Math.max(0, 1 - radius * 1.7);

          const waveY = 0.70 + Math.sin(u * (18 + asciiInputImpulse * 16) + t * 4) * (0.045 + asciiInputImpulse * 0.035) + Math.sin(u * 43 - t + asciiInputSeed) * 0.018;
          const waveform = Math.max(0, 1 - Math.abs(v - waveY) * 75);

          const barZone = v > 0.79 && v < 0.91;
          const barHeight = 0.02 + Math.abs(Math.sin(col * 1.71 + t * 3)) * 0.09;
          const histogram = barZone && v > 0.91 - barHeight ? 0.78 : 0;

          const noise = Math.abs(hashNoise(col, row, Math.floor(t * 5))) * 0.12;
          const value = Math.min(1, ring * 0.32 + crosshair + radarBeam + waveform * 0.9 + histogram + noise);
          if (value < 0.105) continue;

          const char = chars[Math.min(chars.length - 1, Math.floor(value * chars.length))];
          const alpha = 0.18 + value * 0.82;
          ctx.fillStyle = `rgba(255, ${Math.round(38 + value * 40)}, ${Math.round(42 + value * 34)}, ${alpha})`;
          ctx.fillText(char, (col + 0.5) * cellW, (row + 0.5) * cellH);
        }
      }

      const azimuth = document.getElementById('ascii-azimuth');
      const elevation = document.getElementById('ascii-elevation');
      const delta = document.getElementById('ascii-delta');
      if (azimuth) azimuth.textContent = `AZ ${((34.8 + asciiInputSeed * 0.31 + t * 4) % 360).toFixed(1).padStart(5, '0')}`;
      if (elevation) elevation.textContent = `EL ${(17.2 + Math.sin(t + asciiInputSeed) * (4 + asciiInputImpulse * 19)).toFixed(1)}`;
      if (delta) delta.textContent = `Δ ${(0.004 + asciiInputImpulse * 0.086 + (asciiInputCount % 7) * 0.001).toFixed(3)}`;
      asciiInputImpulse = Math.max(0, asciiInputImpulse - (reduced ? 0 : 0.035));

      if (!reduced) animationFrame = requestAnimationFrame(drawAsciiTelemetry);
    }

    const asciiResizeObserver = new ResizeObserver(resizeAsciiTelemetry);
    asciiResizeObserver.observe(asciiCanvas);
    resizeAsciiTelemetry();
    animationFrame = requestAnimationFrame(drawAsciiTelemetry);

    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(animationFrame);
      if (!document.hidden && !prefersReducedMotion()) {
        animationFrame = requestAnimationFrame(drawAsciiTelemetry);
      }
    });
  }

  // --------------------------------------------------------------------
  // Terminal de acceso + teclado virtual dividido (mano izquierda / derecha)
  //
  // Cada mano se arma por COLUMNAS (una por dedo: 1/Q/A/Z, 2/W/S/X, ...) en
  // vez de filas, y cada columna lleva su propio desplazamiento vertical
  // (--col-offset, aplicado en CSS vía nth-child) para imitar el escalonado
  // real de un teclado ergonómico partido.
  // --------------------------------------------------------------------
  const PROMPT = 'wayman@graycris:~$ ';
  const LEFT_COLUMNS = [
    ['1', 'q', 'a', 'z'],
    ['2', 'w', 's', 'x'],
    ['3', 'e', 'd', 'c'],
    ['4', 'r', 'f', 'v'],
    ['5', 't', 'g', 'b'],
  ];
  const RIGHT_COLUMNS = [
    ['6', 'y', 'h', 'n'],
    ['7', 'u', 'j', 'm'],
    ['8', 'i', 'k', ','],
    ['9', 'o', 'l', '.'],
    ['0', 'p', ';', '/'],
  ];
  const PHYSICAL_KEY_PATTERN = /^[a-z0-9\-_;,./]$/i;

  const terminalOutput = document.getElementById('terminal-output');
  const leftHand = document.querySelector('[data-hand="left"]');
  const rightHand = document.querySelector('[data-hand="right"]');

  if (terminalOutput && leftHand && rightHand) {
    const lines = [''];
    const keyElementsByChar = new Map();
    let decodeToken = 0;

    function render() {
      terminalOutput.textContent = lines.map((line) => `${PROMPT}${line}`).join('\n');
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    // Efecto "matrix": el carácter recién tecleado cicla por unos pocos
    // glifos aleatorios antes de asentarse en el real; el resto del texto
    // ya escrito se muestra normal todo el rato. decodeToken invalida
    // limpiamente cualquier ciclo anterior si llega una tecla nueva antes
    // de que termine (para que no se acumulen/peleen varios ciclos a la
    // vez si se teclea rápido).
    function renderWithDecode(newChar) {
      const myToken = ++decodeToken;
      const settled = lines.slice(0, -1).map((line) => `${PROMPT}${line}`);
      const current = lines[lines.length - 1];
      const prefix = [...settled, `${PROMPT}${current.slice(0, -1)}`].join('\n');

      let ticks = 0;
      const maxTicks = 4;
      function tick() {
        if (myToken !== decodeToken) return; // superado por un tecleo más nuevo
        if (ticks >= maxTicks) {
          render();
          return;
        }
        const glyph = MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];
        terminalOutput.textContent = `${prefix}${glyph}`;
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        ticks++;
        setTimeout(tick, 30);
      }
      tick();
    }

    function typeChar(char) {
      reactToTerminalInput(char);
      lines[lines.length - 1] += char;
      if (char === ' ' || prefersReducedMotion()) {
        render();
        return;
      }
      renderWithDecode(char);
    }

    function backspace() {
      reactToTerminalInput('⌫');
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
      render();
    }

    function commitLine() {
      reactToTerminalInput('↵');
      lines.push('');
      render();
    }

    function spawnKeyPopup(keyEl, label) {
      if (prefersReducedMotion()) return;
      const popup = document.createElement('span');
      popup.className = 'key-popup';
      popup.textContent = label;
      keyEl.appendChild(popup);

      let removed = false;
      function cleanup() {
        if (removed) return;
        removed = true;
        popup.remove();
      }
      popup.addEventListener('animationend', cleanup);
      setTimeout(cleanup, 600); // red de seguridad si animationend no llega a disparar
    }

    function makeKey(label, className, onPress) {
      const key = document.createElement('button');
      key.type = 'button';
      key.className = `keyboard__key ${className || ''}`.trim();
      // La letra va en un <span> aparte (que "flota") en vez de directo en
      // el botón, para que el botón (la zona clicable) no se mueva nunca.
      const labelEl = document.createElement('span');
      labelEl.className = 'keyboard__key-label';
      labelEl.textContent = label;
      key.appendChild(labelEl);
      key.addEventListener('click', () => {
        spawnKeyPopup(key, label);
        onPress();
      });
      if (label.length === 1) keyElementsByChar.set(label.toLowerCase(), key);
      return key;
    }

    function buildHand(container, fingerColumns, thumbKeys) {
      const columnsEl = document.createElement('div');
      columnsEl.className = 'keyboard__columns';

      fingerColumns.forEach((column) => {
        const colEl = document.createElement('div');
        colEl.className = 'keyboard__column';
        column.forEach((char) => {
          colEl.appendChild(makeKey(char, '', () => typeChar(char)));
        });
        columnsEl.appendChild(colEl);
      });
      container.appendChild(columnsEl);

      const thumbRow = document.createElement('div');
      thumbRow.className = 'keyboard__thumbs';
      thumbKeys.forEach(([label, className, handler]) => {
        thumbRow.appendChild(makeKey(label, className, handler));
      });
      container.appendChild(thumbRow);
    }

    buildHand(leftHand, LEFT_COLUMNS, [
      ['Borrar', 'keyboard__key--wide', backspace],
      ['Espacio', 'keyboard__key--wide', () => typeChar(' ')],
    ]);

    buildHand(rightHand, RIGHT_COLUMNS, [
      ['Espacio', 'keyboard__key--wide', () => typeChar(' ')],
      ['Enter', 'keyboard__key--wide', commitLine],
    ]);

    // Soporte de teclado físico además del virtual. Solo Enter/Espacio tienen
    // una activación nativa cuando el foco está en un <button> (una tecla
    // virtual, un botón de la taskbar...); para esas dos teclas se deja que
    // el propio botón la gestione y no se duplica la acción. El resto de
    // teclas (letras, números, Backspace) siempre escriben en la terminal,
    // sin importar qué botón haya quedado enfocado tras el último clic.
    document.addEventListener('keydown', (event) => {
      // Con la terminal "bloqueada" (overlay activo) no debe llegar nada,
      // ni siquiera desde el teclado físico (el overlay ya tapa los clics).
      if (document.getElementById('lock-overlay')?.classList.contains('is-visible')) return;

      const focusedButton = event.target.closest('button');
      if (focusedButton && (event.key === 'Enter' || event.key === ' ')) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        commitLine();
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        backspace();
      } else if (event.key === ' ') {
        event.preventDefault();
        typeChar(' ');
      } else if (event.key.length === 1 && PHYSICAL_KEY_PATTERN.test(event.key)) {
        const char = event.key.toLowerCase();
        typeChar(char);
        // Si tecleas con el teclado físico, la tecla virtual equivalente
        // también reacciona (mismo popup que si la hubieras clicado), para
        // que el teclado en pantalla se sienta "vivo" también en ese caso.
        const matchingKey = keyElementsByChar.get(char);
        if (matchingKey) spawnKeyPopup(matchingKey, char);
      }
    });

    render();
  }

  // --------------------------------------------------------------------
  // PLACEHOLDER: interacción futura del dock lateral (marcar módulo activo,
  // filtrar/mostrar tarjetas del módulo seleccionado, etc.)
  // --------------------------------------------------------------------
  // document.querySelectorAll('.dock__item').forEach((item) => {
  //   item.addEventListener('click', () => { ... });
  // });

  // --------------------------------------------------------------------
  // Acciones de la barra inferior (taskbar). Un solo listener delegado en
  // .taskbar (no uno por botón): cada clic dispara un ripple (que se borra
  // solo del DOM al terminar su animación, cancelable/repetible sin
  // acumularse porque cada uno gestiona su propia limpieza) y, según
  // data-action, o un mensaje de "log de sistema" que se autodesvanece a
  // los 4-5s, o el overlay de bloqueo (bloquear-terminal).
  // --------------------------------------------------------------------
  const taskbarEl = document.querySelector('.taskbar');
  const systemLogEl = document.getElementById('system-log');
  const lockOverlayEl = document.getElementById('lock-overlay');
  const reactivateButton = document.getElementById('lock-overlay-reactivate');

  const TASKBAR_MESSAGES = {
    'abrir-informe': 'Acceso concedido. Nivel Ónice verificado.',
    'autorizar-operacion': 'Autorización registrada. Fase de extracción en cola.',
    'borrar-historial': 'Purgando registros... Operación irreversible completada.',
  };

  let logHideTimer = null;

  function showSystemLog(message) {
    if (!systemLogEl) return;
    clearTimeout(logHideTimer); // reinicia limpiamente si llega otro clic antes de que desaparezca
    systemLogEl.textContent = message;
    systemLogEl.classList.add('is-visible');
    logHideTimer = setTimeout(() => {
      systemLogEl.classList.remove('is-visible');
    }, 4500);
  }

  function spawnRipple(button, clientX, clientY) {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    // Un clic activado por teclado (foco + Enter/Espacio) no trae coordenadas
    // reales (clientX/Y llegan en 0); en ese caso el ripple nace centrado.
    const isSynthetic = clientX === 0 && clientY === 0;
    const originX = isSynthetic ? rect.left + rect.width / 2 : clientX;
    const originY = isSynthetic ? rect.top + rect.height / 2 : clientY;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${originX - rect.left - size / 2}px`;
    ripple.style.top = `${originY - rect.top - size / 2}px`;
    button.appendChild(ripple);

    let removed = false;
    function cleanup() {
      if (removed) return;
      removed = true;
      ripple.remove();
    }
    ripple.addEventListener('animationend', cleanup);
    setTimeout(cleanup, 700); // red de seguridad si animationend no llega a disparar
  }

  let lastFocusBeforeLock = null;

  function showLockOverlay() {
    if (!lockOverlayEl) return;
    lastFocusBeforeLock = document.activeElement;
    lockOverlayEl.classList.add('is-visible');
    lockOverlayEl.setAttribute('aria-hidden', 'false');
    if (reactivateButton) reactivateButton.focus();
  }

  function hideLockOverlay() {
    if (!lockOverlayEl) return;
    lockOverlayEl.classList.remove('is-visible');
    lockOverlayEl.setAttribute('aria-hidden', 'true');
    if (lastFocusBeforeLock && typeof lastFocusBeforeLock.focus === 'function') {
      lastFocusBeforeLock.focus();
    }
  }

  if (taskbarEl) {
    taskbarEl.addEventListener('click', (event) => {
      const button = event.target.closest('.taskbar__button');
      if (!button) return;

      spawnRipple(button, event.clientX, event.clientY);

      const action = button.dataset.action;
      if (action === 'bloquear-terminal') {
        showLockOverlay();
      } else if (TASKBAR_MESSAGES[action]) {
        showSystemLog(TASKBAR_MESSAGES[action]);
      }
    });
  }

  if (reactivateButton) {
    reactivateButton.addEventListener('click', hideLockOverlay);
  }

})();
