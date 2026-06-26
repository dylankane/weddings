'use strict';

/* ─────────────────────────────────────────────────────────────────
   POSTA ADMIN — Base JS
───────────────────────────────────────────────────────────────── */

// ─── Mobile Drawer ───────────────────────────────────────────────

const moreBtn       = document.getElementById('bn-more-btn');
const navDrawer     = document.getElementById('nav-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');
const drawerClose   = document.getElementById('drawer-close');

function openDrawer() {
  if (!navDrawer) return;
  navDrawer.classList.add('is-open');
  if (moreBtn) moreBtn.setAttribute('aria-expanded', 'true');
  navDrawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  history.pushState({ drawer: true }, '');
}

function closeDrawer() {
  if (!navDrawer) return;
  navDrawer.classList.remove('is-open');
  if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
  navDrawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (moreBtn)        moreBtn.addEventListener('click', () => {
  navDrawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
});
if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);
if (drawerClose)    drawerClose.addEventListener('click', closeDrawer);

window.addEventListener('popstate', () => {
  if (navDrawer && navDrawer.classList.contains('is-open')) closeDrawer();
  if (searchOverlay && searchOverlay.classList.contains('is-open')) closeSearchOverlay();
  if (selectDrawer && selectDrawer.classList.contains('is-open')) closeSelectDrawer();
});

// ─── Sidebar Search (desktop) ────────────────────────────────────

const sidebarSearchBtn   = document.getElementById('sidebar-search-btn');
const sidebarSearch      = document.getElementById('sidebar-search');
const sidebarSearchInput = sidebarSearch && sidebarSearch.querySelector('.search-input');

function openSidebarSearch() {
  if (!sidebarSearch) return;
  sidebarSearch.classList.add('is-open');
  if (sidebarSearchBtn) sidebarSearchBtn.setAttribute('aria-expanded', 'true');
  if (sidebarSearchInput) sidebarSearchInput.focus();
}

function closeSidebarSearch() {
  if (!sidebarSearch) return;
  sidebarSearch.classList.remove('is-open');
  if (sidebarSearchBtn) sidebarSearchBtn.setAttribute('aria-expanded', 'false');
}

if (sidebarSearchBtn) {
  sidebarSearchBtn.addEventListener('click', () => {
    sidebarSearch.classList.contains('is-open') ? closeSidebarSearch() : openSidebarSearch();
  });
}

// ─── Search Overlay (mobile) ─────────────────────────────────────

const mobileSearchBtn    = document.getElementById('mobile-search-btn');
const searchOverlay      = document.getElementById('search-overlay');
const searchOverlayBg    = document.getElementById('search-overlay-bg');
const searchOverlayClose = document.getElementById('search-overlay-close');
const mobileSearchInput  = searchOverlay && searchOverlay.querySelector('.search-input');

function openSearchOverlay() {
  if (!searchOverlay) return;
  searchOverlay.classList.add('is-open');
  searchOverlay.setAttribute('aria-hidden', 'false');
  if (mobileSearchBtn) {
    mobileSearchBtn.setAttribute('aria-expanded', 'true');
  }
  document.body.style.overflow = 'hidden';
  if (mobileSearchInput) mobileSearchInput.focus();
  history.pushState({ searchOverlay: true }, '');
}

function closeSearchOverlay() {
  if (!searchOverlay) return;
  searchOverlay.classList.remove('is-open');
  searchOverlay.setAttribute('aria-hidden', 'true');
  if (mobileSearchBtn) {
    mobileSearchBtn.setAttribute('aria-expanded', 'false');
  }
  document.body.style.overflow = '';
}

if (mobileSearchBtn)    mobileSearchBtn.addEventListener('click', openSearchOverlay);
if (searchOverlayBg)    searchOverlayBg.addEventListener('click', closeSearchOverlay);
if (searchOverlayClose) searchOverlayClose.addEventListener('click', closeSearchOverlay);

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeSidebarSearch();
  closeSearchOverlay();
  closeSelectDrawer();
});

// ─── Clickable Table Rows ────────────────────────────────────────

document.querySelectorAll('.data-row[data-href]').forEach(row => {
  row.addEventListener('click', () => {
    window.location.href = row.dataset.href;
  });
});

// ─── Section Edit Toggles ────────────────────────────────────────

document.querySelectorAll('.js-section-toggle').forEach(input => {
  input.addEventListener('change', () => {
    input.closest('.form-section').classList.toggle('is-editing', input.checked);
  });
});

// ─── Select Drawer (mobile form dropdowns) ───────────────────────

function isMobile() { return window.innerWidth <= 768; }

const selectDrawer         = document.getElementById('select-drawer');
const selectDrawerBackdrop = document.getElementById('select-drawer-backdrop');
const selectDrawerClose    = document.getElementById('select-drawer-close');
const selectDrawerList     = document.getElementById('select-drawer-list');

let activeDropdown = null;

const statusValues = ['ENQUIRY', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

function makeStatusBadge(value, label) {
  const badge = document.createElement('span');
  badge.className = 'status-badge status-badge--plain';
  const dot = document.createElement('span');
  dot.setAttribute('aria-hidden', 'true');
  if (statusValues.includes(value)) {
    dot.className = `dot dot--${value.toLowerCase()}`;
  } else {
    dot.className = 'dot';
    dot.style.background = 'var(--text-3)';
  }
  badge.appendChild(dot);
  badge.appendChild(document.createTextNode(label));
  return badge;
}

function openSelectDrawer(dropdown) {
  if (!selectDrawer) return;
  activeDropdown = dropdown;
  const currentValue = dropdown.querySelector('input[type="hidden"]').value;

  selectDrawerList.innerHTML = '';
  [...dropdown.querySelectorAll('.form-dropdown-option')].forEach(opt => {
    const value = opt.dataset.value;
    const selected = value === currentValue;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn' + (selected ? ' fw-heavy' : '');
    btn.dataset.value = value;
    btn.appendChild(makeStatusBadge(value, opt.textContent.trim()));
    btn.addEventListener('click', () => selectDrawerPick(btn));
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectDrawerPick(btn); }
      if (e.key === 'Escape') closeSelectDrawer();
    });
    selectDrawerList.appendChild(btn);
  });

  selectDrawer.classList.add('is-open');
  selectDrawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  history.pushState({ selectDrawer: true }, '');
}

function closeSelectDrawer() {
  if (!selectDrawer) return;
  selectDrawer.classList.remove('is-open');
  selectDrawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  activeDropdown = null;
}

function selectDrawerPick(li) {
  if (!activeDropdown) return;
  const input   = activeDropdown.querySelector('input[type="hidden"]');
  const valueEl = activeDropdown.querySelector('.form-dropdown-value');
  const opts    = [...activeDropdown.querySelectorAll('.form-dropdown-option')];

  input.value = li.dataset.value;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  valueEl.textContent = li.textContent.trim();
  opts.forEach(o => { o.classList.remove('is-selected'); o.setAttribute('aria-selected', 'false'); });
  const match = opts.find(o => o.dataset.value === li.dataset.value);
  if (match) { match.classList.add('is-selected'); match.setAttribute('aria-selected', 'true'); }

  const autosubmit = activeDropdown.hasAttribute('data-autosubmit');
  const form       = activeDropdown.closest('form');
  closeSelectDrawer();
  if (autosubmit && form) form.submit();
}

if (selectDrawerBackdrop) selectDrawerBackdrop.addEventListener('click', closeSelectDrawer);
if (selectDrawerClose)    selectDrawerClose.addEventListener('click', closeSelectDrawer);

// ─── Table Scroll Fade ───────────────────────────────────────────

document.querySelectorAll('.table-wrap, .cal-wrap').forEach(tableWrap => {
  function updateTableFade() {
    const atEnd = tableWrap.scrollLeft + tableWrap.clientWidth >= tableWrap.scrollWidth - 1;
    tableWrap.classList.toggle('scroll-end', atEnd);
  }
  tableWrap.addEventListener('scroll', updateTableFade, { passive: true });
  window.addEventListener('resize', updateTableFade, { passive: true });
  updateTableFade();
});

// ─── Form Dropdown ───────────────────────────────────────────────

document.querySelectorAll('[data-dropdown]').forEach(dropdown => {
  const trigger = dropdown.querySelector('.js-dropdown-trigger');
  const list    = dropdown.querySelector('.form-dropdown-list');
  const input   = dropdown.querySelector('input[type="hidden"]');
  const valueEl = dropdown.querySelector('.form-dropdown-value');
  const options = [...list.querySelectorAll('.form-dropdown-option')];

  function closeDropdown(d) {
    d = d || dropdown;
    d.classList.remove('is-open');
    d.querySelector('.js-dropdown-trigger').setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    if (isMobile() && selectDrawer) {
      openSelectDrawer(dropdown);
    } else if (dropdown.classList.contains('is-open')) {
      closeDropdown();
    } else {
      document.querySelectorAll('[data-dropdown].is-open').forEach(closeDropdown);
      dropdown.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  trigger.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); dropdown.classList.contains('is-open') ? options[0]?.focus() : trigger.click(); }
    if (e.key === 'Escape')    { closeDropdown(); }
  });

  options.forEach(option => {
    option.addEventListener('click', () => {
      input.value = option.dataset.value;
      valueEl.textContent = option.textContent.trim();
      options.forEach(o => { o.classList.remove('is-selected'); o.setAttribute('aria-selected', 'false'); });
      option.classList.add('is-selected');
      option.setAttribute('aria-selected', 'true');
      closeDropdown();
      trigger.focus();
      if (dropdown.hasAttribute('data-autosubmit')) dropdown.closest('form').submit();
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    option.addEventListener('keydown', e => {
      const idx = options.indexOf(option);
      if (e.key === 'ArrowDown') { e.preventDefault(); options[idx + 1]?.focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); idx > 0 ? options[idx - 1].focus() : trigger.focus(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); option.click(); }
      if (e.key === 'Escape') { closeDropdown(); trigger.focus(); }
    });
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('[data-dropdown].is-open').forEach(d => {
    d.classList.remove('is-open');
    d.querySelector('.js-dropdown-trigger').setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.js-section-cancel').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.closest('.form-section');
    const toggle  = section.querySelector('.js-section-toggle');
    section.classList.remove('is-editing');
    if (toggle) toggle.checked = false;
  });
});

// ─── Nav Search ──────────────────────────────────────────────

const sidebarSearchResults = document.getElementById('sidebar-search-results');
const mobileSearchResults  = document.getElementById('mobile-search-results');

function formatSearchDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderSearchResults(container, results) {
  container.innerHTML = '';
  if (!results.length) {
    container.innerHTML = '<p class="search-empty">No results found.</p>';
    return;
  }
  results.forEach(r => {
    const a    = document.createElement('a');
    a.href     = r.url;
    a.className = 'search-result-item';

    const info = document.createElement('div');

    const name = document.createElement('span');
    name.className   = 'search-result-name';
    name.textContent = r.customerName || `Job #${r.id}`;
    info.appendChild(name);

    const meta = document.createElement('span');
    meta.className   = 'search-result-meta';
    meta.textContent = formatSearchDate(r.jobStart) || `Job #${r.id}`;
    info.appendChild(meta);

    a.appendChild(info);

    if (r.status) {
      const dot = document.createElement('span');
      dot.className = `dot dot--${r.status.toLowerCase()}`;
      dot.setAttribute('aria-hidden', 'true');
      a.appendChild(dot);
    }

    container.appendChild(a);
  });
}

function resetSearchResults() {
  [sidebarSearchResults, mobileSearchResults].forEach(el => {
    if (el) el.innerHTML = '<p class="search-empty">Start typing to search…</p>';
  });
}

let searchTimer = null;
let lastQuery   = '';

function doSearch(q) {
  if (q === lastQuery) return;
  lastQuery = q;

  if (q.length < 2) {
    resetSearchResults();
    return;
  }

  fetch(`/admin/api/search?q=${encodeURIComponent(q)}`)
    .then(r => r.json())
    .then(data => {
      [sidebarSearchResults, mobileSearchResults].forEach(el => {
        if (el) renderSearchResults(el, data.results);
      });
    })
    .catch(() => {
      [sidebarSearchResults, mobileSearchResults].forEach(el => {
        if (el) el.innerHTML = '<p class="search-empty">Search unavailable.</p>';
      });
    });
}

[sidebarSearchInput, mobileSearchInput].forEach(input => {
  if (!input) return;
  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => doSearch(input.value.trim()), 250);
  });
});

// ─── Table Search ────────────────────────────────────────────────

const TABLE_MONTH_NORM = {
  january: 'jan', february: 'feb', march: 'mar', april: 'apr',
  may: 'may', june: 'jun', july: 'jul', august: 'aug',
  september: 'sep', october: 'oct', november: 'nov', december: 'dec',
};

document.querySelectorAll('.table-filter-bar').forEach(bar => {
  const textInput   = bar.querySelector('.search-input');
  const statusInput = bar.querySelector('.js-filter-status');
  const card        = bar.nextElementSibling;
  if (!textInput || !card) return;

  function applyFilter() {
    const raw    = textInput.value.trim().toLowerCase();
    const q      = TABLE_MONTH_NORM[raw] || raw;
    const status = statusInput ? statusInput.value : '';

    card.querySelectorAll('tbody tr').forEach(row => {
      const textMatch   = !q      || row.textContent.toLowerCase().includes(q);
      const statusMatch = !status || row.dataset.status === status;
      row.style.display = (textMatch && statusMatch) ? '' : 'none';
    });
  }

  textInput.addEventListener('input', applyFilter);
  if (statusInput) statusInput.addEventListener('change', applyFilter);
});
