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

  // ── Panel helpers ─────────────────────────────────────────────
  function openPanel(panelEl, toggleEl, otherPanelEl, otherToggleEl) {
    if (otherPanelEl && otherPanelEl.classList.contains('is-open')) {
      otherPanelEl.classList.remove('is-open');
      if (otherToggleEl) otherToggleEl.setAttribute('aria-expanded', 'false');
    }
    panelEl.classList.add('is-open');
    toggleEl.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      panelEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function closePanel(panelEl, toggleEl) {
    panelEl.classList.remove('is-open');
    toggleEl.setAttribute('aria-expanded', 'false');
  }

  // ── Delivery panel ───────────────────────────────────────────
  const deliveryToggle = document.getElementById('delivery-toggle');
  const deliveryPanel  = document.getElementById('delivery-panel');
  const deliveryClose  = deliveryPanel ? deliveryPanel.querySelector('.delivery-close') : null;

  // ── Custom cards panel ───────────────────────────────────────
  const ccToggle = document.getElementById('custom-cards-toggle');
  const ccPanel  = document.getElementById('custom-cards-panel');
  const ccClose  = ccPanel ? ccPanel.querySelector('.custom-cards-close') : null;

  if (deliveryToggle && deliveryPanel) {
    deliveryToggle.addEventListener('click', () => {
      deliveryPanel.classList.contains('is-open')
        ? closePanel(deliveryPanel, deliveryToggle)
        : openPanel(deliveryPanel, deliveryToggle, ccPanel, ccToggle);
    });
  }

  if (deliveryClose) {
    deliveryClose.addEventListener('click', () => closePanel(deliveryPanel, deliveryToggle));
  }

  if (ccToggle && ccPanel) {
    ccToggle.addEventListener('click', () => {
      ccPanel.classList.contains('is-open')
        ? closePanel(ccPanel, ccToggle)
        : openPanel(ccPanel, ccToggle, deliveryPanel, deliveryToggle);
    });
  }

  if (ccClose) {
    ccClose.addEventListener('click', () => closePanel(ccPanel, ccToggle));
  }

  // ── Query param: delivery footer link animation ──────────
  if (new URLSearchParams(window.location.search).get('delivery') === '1'
      && deliveryPanel && deliveryToggle) {

    history.replaceState(null, '', '/');

    var deliveryCard = deliveryToggle.closest('.card');

    setTimeout(function () {

      // Step 1: scroll to delivery card and let it settle
      if (deliveryCard) {
        deliveryCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Step 2: scroll + reveal animation complete — run highlight
      setTimeout(function () {
        if (deliveryCard) {
          deliveryCard.classList.add('card--highlight');
        }

        // Step 3: highlight finished — open panel, remove highlight class
        setTimeout(function () {
          if (deliveryCard) {
            deliveryCard.classList.remove('card--highlight');
          }
          deliveryPanel.classList.add('is-open');
          deliveryToggle.setAttribute('aria-expanded', 'true');

          // Step 4: panel fully expanded — scroll to it
          setTimeout(function () {
            deliveryPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 900);

        }, 1100);

      }, 2200);

    }, 300);
  }

})();
