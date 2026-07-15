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

  // Glifos para el efecto "matrix" de descifrado (letras, números, símbolos
  // y algo de katakana, en el espíritu del original — el color se queda en
  // el rojo de la app en vez de saltar a verde, para no romper la paleta).
  const MATRIX_GLYPHS = '01アイウエオカキクケコサシスセソABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&*+-<>/\\|';

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
      lines[lines.length - 1] += char;
      if (char === ' ' || prefersReducedMotion()) {
        render();
        return;
      }
      renderWithDecode(char);
    }

    function backspace() {
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
      render();
    }

    function commitLine() {
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
