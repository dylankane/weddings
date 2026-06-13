'use strict';

(function () {
  document.querySelectorAll('.footer-copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        btn.classList.add('footer-copy-btn--copied');
        setTimeout(() => btn.classList.remove('footer-copy-btn--copied'), 1500);
      } catch (e) {}
    });
  });
})();
