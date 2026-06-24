'use strict';

function resize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
  el.style.overflowY = el.offsetHeight < el.scrollHeight ? 'auto' : 'hidden';
}

document.querySelectorAll('.form-textarea').forEach(el => {
  resize(el);
  el.addEventListener('input', () => resize(el));
});

document.querySelectorAll('.js-section-toggle').forEach(toggle => {
  toggle.addEventListener('change', () => {
    if (!toggle.checked) return;
    toggle.closest('.form-section').querySelectorAll('.form-textarea').forEach(resize);
  });
});
