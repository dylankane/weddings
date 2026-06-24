'use strict';

/* ─────────────────────────────────────────────────────────────────
   POSTA ADMIN — Settings JS
   Tab switching with URL persistence.
───────────────────────────────────────────────────────────────── */

const tabs   = document.querySelectorAll('.settings-tab');
const panels = document.querySelectorAll('.settings-panel');

const VALID_TABS = ['company', 'delivery-zones', 'email-templates', 'profile'];

function activateTab(tabName) {
  const name = VALID_TABS.includes(tabName) ? tabName : 'company';
  tabs.forEach(t => {
    const active = t.dataset.tab === name;
    t.classList.toggle('is-active', active);
    t.setAttribute('aria-selected', String(active));
  });
  panels.forEach(p => p.classList.toggle('is-active', p.id === `panel-${name}`));
}

// Initialise from URL
const params = new URLSearchParams(location.search);
activateTab(params.get('tab') || 'company');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const name = tab.dataset.tab;
    activateTab(name);
    const url = new URL(location.href);
    url.searchParams.set('tab', name);
    history.pushState({ tab: name }, '', url);
  });
});

window.addEventListener('popstate', e => {
  const p = new URLSearchParams(location.search);
  activateTab(p.get('tab') || 'company');
});

// ─── Zone Form Panel ─────────────────────────────────────────────

const zonePanel      = document.getElementById('zone-form-panel');
const zoneForm       = document.getElementById('zone-form');
const zoneTitle      = document.getElementById('zone-form-title');
const zoneName       = document.getElementById('zone-name');
const zoneDesc       = document.getElementById('zone-description');
const zoneMinKm      = document.getElementById('zone-min-km');
const zoneMaxKm      = document.getElementById('zone-max-km');
const zonePrice      = document.getElementById('zone-price');
const zoneDeleteForm = document.getElementById('js-zone-delete-form');
const zoneDeleteBtn  = document.getElementById('js-zone-delete-btn');

function openZonePanel(mode, row) {
  if (mode === 'edit') {
    zoneForm.action       = `/admin/settings/zones/${row.dataset.id}`;
    zoneTitle.textContent = row.dataset.name;
    zoneName.value        = row.dataset.name;
    zoneDesc.value        = row.dataset.description;
    zoneMinKm.value       = row.dataset.minKm;
    zoneMaxKm.value       = row.dataset.maxKm;
    zonePrice.value       = row.dataset.price;

    zoneDeleteForm.action    = `/admin/settings/zones/${row.dataset.id}/delete`;
    zoneDeleteForm.hidden    = false;
    zoneDeleteBtn.hidden     = false;

    document.querySelectorAll('.js-zone-row').forEach(r => r.classList.remove('is-selected'));
    row.classList.add('is-selected');
  } else {
    zoneForm.action       = '/admin/settings/zones';
    zoneTitle.textContent = 'New Tier';
    zoneName.value        = '';
    zoneDesc.value        = '';
    zoneMinKm.value       = '';
    zoneMaxKm.value       = '';
    zonePrice.value       = '';
    zoneDeleteForm.hidden = true;
    zoneDeleteBtn.hidden  = true;

    document.querySelectorAll('.js-zone-row').forEach(r => r.classList.remove('is-selected'));
  }

  zonePanel.hidden = false;
  zonePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

if (zonePanel) {
  document.getElementById('js-zone-add').addEventListener('click', () => openZonePanel('create', null));

  document.querySelectorAll('.js-zone-row').forEach(row => {
    row.addEventListener('click', () => openZonePanel('edit', row));
  });

  document.getElementById('js-zone-cancel').addEventListener('click', () => {
    zonePanel.hidden = true;
    document.querySelectorAll('.js-zone-row').forEach(r => r.classList.remove('is-selected'));
  });

  zoneDeleteForm.addEventListener('submit', e => {
    if (!confirm('Delete this delivery zone? This cannot be undone.')) e.preventDefault();
  });
}

// ─── Template Form Panel ─────────────────────────────────────────

const templatePanel = document.getElementById('template-form-panel');
const templateForm  = document.getElementById('template-form');
const templateTitle = document.getElementById('template-form-title');
const tplSubject    = document.getElementById('tpl-subject');
const tplBody       = document.getElementById('tpl-body');
const tplActive     = document.getElementById('tpl-active');

let lastFocused = null;

if (templatePanel) {
  document.querySelectorAll('.js-template-row').forEach(row => {
    row.addEventListener('click', () => {
      templateForm.action    = `/admin/settings/templates/${row.dataset.id}`;
      templateTitle.textContent = row.dataset.name;
      tplSubject.value       = row.dataset.subject;
      tplBody.value          = row.dataset.body;
      tplActive.checked      = row.dataset.active === 'true';

      document.querySelectorAll('.js-template-row').forEach(r => r.classList.remove('is-selected'));
      row.classList.add('is-selected');

      templatePanel.hidden = false;
      lastFocused = tplSubject;
      templatePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.getElementById('js-template-cancel').addEventListener('click', () => {
    templatePanel.hidden = true;
    document.querySelectorAll('.js-template-row').forEach(r => r.classList.remove('is-selected'));
  });

  templatePanel.querySelectorAll('.js-token-target').forEach(input => {
    input.addEventListener('focus', () => { lastFocused = input; });
  });

  templatePanel.querySelectorAll('.js-token-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (!lastFocused) return;
      const token = chip.dataset.token;
      const start = lastFocused.selectionStart;
      const end   = lastFocused.selectionEnd;
      lastFocused.value = lastFocused.value.slice(0, start) + token + lastFocused.value.slice(end);
      lastFocused.selectionStart = lastFocused.selectionEnd = start + token.length;
      lastFocused.focus();
    });
  });
}
