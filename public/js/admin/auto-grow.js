'use strict';

function initAutoGrow(el) {
  function resize() {
    el.style.height = '0';
    el.style.height = el.scrollHeight + 'px';
    el.style.overflowY = el.offsetHeight < el.scrollHeight ? 'auto' : 'hidden';
  }

  el.addEventListener('input', resize);
  resize();
}

document.querySelectorAll('.form-textarea').forEach(initAutoGrow);
