'use strict';

(function () {
  const form      = document.getElementById('con-form');
  const submitBtn = document.getElementById('con-submit');
  const successEl = document.getElementById('con-success');

  if (!form) return;

  const fields = {
    name:    { el: document.getElementById('con-name'),    errEl: document.getElementById('con-name-error'),    validate: v => v.trim() ? '' : 'Please enter your name.' },
    email:   { el: document.getElementById('con-email'),   errEl: document.getElementById('con-email-error'),   validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.' },
    message: { el: document.getElementById('con-message'), errEl: document.getElementById('con-message-error'), validate: v => v.trim() ? '' : 'Please enter a message.' },
  };

  function validateField(key) {
    const { el, errEl, validate } = fields[key];
    const msg = validate(el.value);
    errEl.textContent = msg;
    el.classList.toggle('form-input--error', !!msg);
    return !msg;
  }

  Object.keys(fields).forEach(key => {
    fields[key].el.addEventListener('blur', () => validateField(key));
    fields[key].el.addEventListener('input', () => {
      if (fields[key].el.classList.contains('form-input--error')) validateField(key);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const valid = Object.keys(fields).reduce((acc, key) => validateField(key) && acc, true);
    if (!valid) return;

    document.getElementById('con-success-name').textContent  = fields.name.el.value.trim();
    document.getElementById('con-success-email').textContent = fields.email.el.value.trim();

    form.hidden      = true;
    successEl.hidden = false;
    successEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();

(function () {
  document.querySelectorAll('.con-copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        btn.classList.add('con-copy-btn--copied');
        setTimeout(() => btn.classList.remove('con-copy-btn--copied'), 1500);
      } catch (e) {
        // clipboard API unavailable — silent fail
      }
    });
  });
})();
