'use strict';

(function () {

  const dateInput = document.getElementById('avail-date');
  const clearBtn  = document.getElementById('avail-clear');
  const statusEl  = document.getElementById('avail-status');
  const strip     = document.getElementById('avail-strip');

  if (!dateInput) return;

  // ── Read ?date= param on load ─────────────────────────────
  const params    = new URLSearchParams(window.location.search);
  const dateParam = params.get('date');

  if (dateParam) {
    dateInput.value = dateParam;
    clearBtn.hidden = false;
    strip.classList.add('avail-strip--active');
    checkAvailability(dateParam);
  }

  // ── Date input ────────────────────────────────────────────
  dateInput.addEventListener('change', () => {
    const val = dateInput.value;
    if (!val) {
      clearState();
      return;
    }
    clearBtn.hidden = false;
    strip.classList.add('avail-strip--active');
    checkAvailability(val);
    updateUrl(val);
  });

  // ── Clear button ──────────────────────────────────────────
  clearBtn.addEventListener('click', () => {
    dateInput.value = '';
    clearState();
    removeUrlDate();
  });

  // ── Helpers ───────────────────────────────────────────────
  function clearState() {
    clearBtn.hidden = true;
    strip.classList.remove('avail-strip--active', 'avail-strip--loading');
    statusEl.textContent = '';
    document.querySelectorAll('[data-product-id]').forEach(el => {
      el.classList.remove('col-item--unavailable');
      const label = el.querySelector('.col-item-unavail-label');
      if (label) label.textContent = 'Unavailable';
    });
  }

  function updateUrl(date) {
    const url = new URL(window.location);
    url.searchParams.set('date', date);
    history.replaceState(null, '', url);
  }

  function removeUrlDate() {
    const url = new URL(window.location);
    url.searchParams.delete('date');
    history.replaceState(null, '', url);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Availability check ────────────────────────────────────
  async function checkAvailability(dateStr) {
    strip.classList.add('avail-strip--loading');
    statusEl.textContent = 'Checking…';

    try {
      const res = await fetch('/api/availability?start=' + dateStr + '&end=' + dateStr);
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();

      strip.classList.remove('avail-strip--loading');

      const all         = data.products;
      const unavailable = all.filter(p => p.availableQuantity <= 0);
      const available   = all.filter(p => p.availableQuantity > 0);

      if (unavailable.length === 0) {
        statusEl.textContent = 'All pieces available';
      } else if (available.length === 0) {
        statusEl.textContent = 'No pieces available for this date';
      } else {
        statusEl.textContent = available.length + ' available';
      }

      const formatted = formatDate(dateStr);

      all.forEach(p => {
        const el = document.querySelector('[data-product-id="' + p.id + '"]');
        if (!el) return;

        if (p.availableQuantity <= 0) {
          el.classList.add('col-item--unavailable');
          const label = el.querySelector('.col-item-unavail-label');
          if (label) label.textContent = 'Unavailable · ' + formatted;
        } else {
          el.classList.remove('col-item--unavailable');
        }
      });

    } catch {
      strip.classList.remove('avail-strip--loading');
      statusEl.textContent = 'Unable to check — try again';
    }
  }

})();
