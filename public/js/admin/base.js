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

if (moreBtn)        moreBtn.addEventListener('click', openDrawer);
if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);
if (drawerClose)    drawerClose.addEventListener('click', closeDrawer);

window.addEventListener('popstate', () => {
  if (navDrawer && navDrawer.classList.contains('is-open')) {
    closeDrawer();
  }
});

// ─── Clickable Table Rows ────────────────────────────────────────

document.querySelectorAll('.data-row[data-href]').forEach(row => {
  row.addEventListener('click', () => {
    window.location.href = row.dataset.href;
  });
});
