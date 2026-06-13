'use strict';

(function () {

  const lb         = document.getElementById('lb');
  const lbImg      = document.getElementById('lb-img');
  const lbClose    = document.getElementById('lb-close');
  const lbPrev     = document.getElementById('lb-prev');
  const lbNext     = document.getElementById('lb-next');
  const lbBackdrop = document.getElementById('lb-backdrop');
  const lbDots     = document.getElementById('lb-dots');

  if (!lb) return;

  const FALLBACK = '/images/public/produt-fallback.jpeg';
  let images  = [];
  let current = 0;

  function buildDots() {
    lbDots.innerHTML = '';
    if (images.length < 2) return;
    lbDots.innerHTML = images
      .map((_, i) => `<span class="lb-dot${i === 0 ? ' is-active' : ''}"></span>`)
      .join('');
  }

  function show(index) {
    current         = index;
    lbImg.src       = images[current].url;
    lbImg.alt       = images[current].alt || '';
    lbPrev.disabled = current === 0;
    lbNext.disabled = current === images.length - 1;
    lbDots.querySelectorAll('.lb-dot').forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
    });
  }

  function open(imgArray) {
    images = imgArray;
    buildDots();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    show(0);
    lbClose.focus();
  }

  function close() {
    lb.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.lb-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const urls = (btn.dataset.images || '').split('|').filter(Boolean);
      const alts = (btn.dataset.alts  || '').split('|');
      while (urls.length < 3) urls.push(FALLBACK);
      open(urls.map((url, i) => ({ url: url || FALLBACK, alt: alts[i] || '' })));
    });
  });

  lbClose.addEventListener('click', close);
  lbBackdrop.addEventListener('click', close);
  lbPrev.addEventListener('click', () => { if (current > 0) show(current - 1); });
  lbNext.addEventListener('click', () => { if (current < images.length - 1) show(current + 1); });

  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft'  && current > 0)                show(current - 1);
    if (e.key === 'ArrowRight' && current < images.length - 1) show(current + 1);
  });

  let touchStartX = 0;
  lb.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) < 50) return;
    if (diff < 0 && current < images.length - 1) show(current + 1);
    if (diff > 0 && current > 0)                 show(current - 1);
  });

})();
