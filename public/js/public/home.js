'use strict';

(function () {

  // ── Nav colour switch ─────────────────────────────────────
  const nav = document.getElementById('nav');
  const features = document.querySelector('.grid-2');

  if (nav && features) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        nav.classList.toggle('on-cream', e.isIntersecting);
      });
    }, { threshold: 0.01, rootMargin: '-60px 0px 0px 0px' });
    io.observe(features);
  }

})();
