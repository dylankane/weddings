'use strict';

(function () {

  // ── Animation config ──────────────────────────────────────
  const DIST = 150;
  const DUR = { slow: 1500, base: 1800, fast: 1500 };
  const EASE = 'cubic-bezier(0.42, 0, 0.58, 1)';
  const EASE_FADE = 'cubic-bezier(0.42, 0, 0.58, 1)';

  const KEYFRAMES = {
    'reveal-left':   [{ opacity: 0, transform: `translateX(-${DIST}px)` }, { opacity: 1, transform: 'none' }],
    'reveal-right':  [{ opacity: 0, transform: `translateX(${DIST}px)` },  { opacity: 1, transform: 'none' }],
    'reveal-bottom': [{ opacity: 0, transform: `translateY(${DIST}px)` },  { opacity: 1, transform: 'none' }],
    'reveal-fade':   [{ opacity: 0 }, { opacity: 1 }],
    'fade-slow':     [{ opacity: 0 }, { opacity: 1 }],
    'fade-fast':     [{ opacity: 0 }, { opacity: 1 }],
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Hero: load animations ─────────────────────────────────
  if (!reduced) {
    const fadeSlow = document.querySelector('.fade-slow');
    const fadeFast = document.querySelector('.fade-fast');

    if (fadeSlow) {
      fadeSlow.animate(KEYFRAMES['fade-slow'], {
        duration: DUR.slow,
        easing: EASE_FADE,
        fill: 'forwards',
        delay: 300,
      });
    }

    if (fadeFast) {
      fadeFast.animate(KEYFRAMES['fade-fast'], {
        duration: DUR.fast,
        easing: EASE_FADE,
        fill: 'forwards',
        delay: 800,
      });
    }
  }

  // ── Scroll reveals ────────────────────────────────────────
  const SCROLL_CLASSES = ['reveal-left', 'reveal-right', 'reveal-bottom', 'reveal-fade'];
  const scrollEls = document.querySelectorAll(SCROLL_CLASSES.map(c => `.${c}`).join(', '));

  if (scrollEls.length && !reduced) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const cls = SCROLL_CLASSES.find(c => e.target.classList.contains(c));
        if (!cls) return;
        e.target.animate(KEYFRAMES[cls], {
          duration: DUR.base,
          easing: cls === 'reveal-fade' ? EASE_FADE : EASE,
          fill: 'forwards'
        });
        observer.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -25% 0px' });

    scrollEls.forEach(el => observer.observe(el));
  }

})();
