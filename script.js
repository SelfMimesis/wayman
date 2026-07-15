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

  const clockEl = document.getElementById('corporate-clock');

  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}:${ss}`;
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

    function render() {
      terminalOutput.textContent = lines.map((line) => `${PROMPT}${line}`).join('\n');
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function typeChar(char) {
      lines[lines.length - 1] += char;
      render();
    }

    function backspace() {
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
      render();
    }

    function commitLine() {
      lines.push('');
      render();
    }

    function makeKey(label, className, onPress) {
      const key = document.createElement('button');
      key.type = 'button';
      key.className = `keyboard__key ${className || ''}`.trim();
      key.textContent = label;
      key.addEventListener('click', onPress);
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
        typeChar(event.key.toLowerCase());
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
  // PLACEHOLDER: acciones reales de la barra inferior (taskbar)
  // --------------------------------------------------------------------
  // document.querySelectorAll('.taskbar__button').forEach((btn) => {
  //   btn.addEventListener('click', () => { ... });
  // });

})();
