'use strict';

/* ─────────────────────────────────────────────────────────────────
   POSTA ADMIN — Documents JS
   Tab switching + row-click PDF preview.
───────────────────────────────────────────────────────────────── */

const tabs   = document.querySelectorAll('.settings-tab');
const panels = document.querySelectorAll('.settings-panel');

const VALID_TABS = ['invoices', 'quotes', 'settings'];

function activateTab(tabName) {
  const name = VALID_TABS.includes(tabName) ? tabName : 'invoices';
  tabs.forEach(t => {
    const active = t.dataset.tab === name;
    t.classList.toggle('is-active', active);
    t.setAttribute('aria-selected', String(active));
  });
  panels.forEach(p => p.classList.toggle('is-active', p.id === `panel-${name}`));
}

const params = new URLSearchParams(location.search);
activateTab(params.get('tab') || 'invoices');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const name = tab.dataset.tab;
    activateTab(name);
    const url = new URL(location.href);
    url.searchParams.set('tab', name);
    history.pushState({ tab: name }, '', url);
  });
});

window.addEventListener('popstate', () => {
  const p = new URLSearchParams(location.search);
  activateTab(p.get('tab') || 'invoices');
});

// ─── Row preview ─────────────────────────────────────────────────

function setupPreview(rowSelector, previewId, buildSrc) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  const frame = preview.querySelector('iframe');

  document.querySelectorAll(rowSelector).forEach(row => {
    row.addEventListener('click', () => {
      document.querySelectorAll(rowSelector).forEach(r => r.classList.remove('is-selected'));
      row.classList.add('is-selected');
      frame.src     = buildSrc(row.dataset.jobId);
      preview.hidden = false;
      preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

setupPreview('.js-invoice-row', 'invoice-preview', id => `/admin/jobs/${id}/invoice/preview`);
setupPreview('.js-quote-row',   'quote-preview',   id => `/admin/jobs/${id}/quote/preview`);
