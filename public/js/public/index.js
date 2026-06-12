'use strict';

(function () {

  // ── Availability: navigate to collection with selected date ───
  const avField = document.querySelector('.avail-mock-field');
  if (avField) {
    avField.addEventListener('change', () => {
      const val = avField.value;
      if (!val) return;
      window.location.href = '/collection?date=' + encodeURIComponent(val);
    });
  }

  // ── Delivery panel toggle ─────────────────────────────────────
  const toggle   = document.getElementById('delivery-toggle');
  const panel    = document.getElementById('delivery-panel');
  const closeBtn = panel ? panel.querySelector('.delivery-close') : null;

  function openPanel() {
    panel.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function closePanel() {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      panel.classList.contains('is-open') ? closePanel() : openPanel();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closePanel);
  }

})();
