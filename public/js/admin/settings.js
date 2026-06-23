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
