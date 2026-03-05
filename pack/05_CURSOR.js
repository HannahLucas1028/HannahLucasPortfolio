/**
 * HML Signature Cursor — heart monogram, transparent bg, colorizable
 * Uses /assets/hml-cursor.png — only hearts + initials visible.
 * Color is applied via CSS hue-rotate filter (no background, no tint overlay).
 */
(function () {
  var root = document.documentElement;

  /** Convert a hex color to HSL hue degrees (for CSS filter hue-rotate) */
  function hexToHue(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(function(c){ return c+c; }).join('');
    var r = parseInt(hex.slice(0,2),16)/255;
    var g = parseInt(hex.slice(2,4),16)/255;
    var b = parseInt(hex.slice(4,6),16)/255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    var h = 0;
    if (max !== min) {
      var d = max - min;
      if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else                h = ((r - g) / d + 4) / 6;
    }
    return Math.round(h * 360);
  }

  function ensureCursor() {
    if (document.querySelector('.hml-cursor')) return;

    var el = document.createElement('div');
    el.className = 'hml-cursor';
    el.innerHTML = '<img class="hml-cursor__img" src="/assets/hml-cursor.png" alt="" aria-hidden="true" />';
    document.body.appendChild(el);
    document.body.classList.add('hml-custom-cursor');

    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var tx = x, ty = y;

    function tick() {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      el.style.transform = 'translate(' + x + 'px, ' + y + 'px) translate(-50%, -50%)';
      requestAnimationFrame(tick);
    }
    tick();

    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
    }, { passive: true });

    document.addEventListener('mousedown', function () {
      document.body.classList.add('hml-cursor-click');
    });
    document.addEventListener('mouseup', function () {
      document.body.classList.remove('hml-cursor-click');
    });
  }

  // Runway Studio API
  window.HMLCursor = {
    init: ensureCursor,
    setColor: function (hex) {
      root.style.setProperty('--hml-cursor-color', hex);
      root.style.setProperty('--hml-hue', hexToHue(hex) + 'deg');
    },
    setSize: function (px) {
      root.style.setProperty('--hml-cursor-size', px + 'px');
    },
    enable: function () {
      ensureCursor();
      document.body.classList.add('hml-custom-cursor');
      var c = document.querySelector('.hml-cursor');
      if (c) c.style.display = 'block';
    },
    disable: function () {
      document.body.classList.remove('hml-custom-cursor');
      var c = document.querySelector('.hml-cursor');
      if (c) c.style.display = 'none';
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var calm = document.documentElement.dataset.calmMode === 'true';
    if (!calm) ensureCursor();
  });
})();
