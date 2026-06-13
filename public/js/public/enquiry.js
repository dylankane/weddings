'use strict';

(function () {
  const form       = document.getElementById('enq-form');
  const submitBtn  = document.getElementById('enq-submit');
  const successEl  = document.getElementById('enq-success');
  const formErrEl  = document.getElementById('enq-form-error');

  if (!form) return;

  const originalBtnHTML = submitBtn.innerHTML;

  const fields = {
    name:        { el: document.getElementById('enq-name'),   errEl: document.getElementById('enq-name-error'),   validate: v => v.trim() ? '' : 'Please enter your full name.' },
    email:       { el: document.getElementById('enq-email'),  errEl: document.getElementById('enq-email-error'),  validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.' },
    weddingDate: { el: document.getElementById('enq-date'),   errEl: document.getElementById('enq-date-error'),   validate: v => v ? '' : 'Please select your wedding date.' },
    venueName:   { el: document.getElementById('enq-venue'),  errEl: document.getElementById('enq-venue-error'),  validate: v => v.trim() ? '' : 'Please enter your venue name.' },
    venueCounty: { el: document.getElementById('enq-county'), errEl: document.getElementById('enq-county-error'), validate: v => v.trim() ? '' : 'Please enter your county.' },
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

  function getProductSlugs() {
    return [...form.querySelectorAll('input[name="productSlug"]:checked')].map(el => el.value);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let valid = Object.keys(fields).reduce((acc, key) => validateField(key) && acc, true);

    const productErrEl  = document.getElementById('enq-product-error');
    const productSlugs  = getProductSlugs();
    if (!productSlugs.length) {
      productErrEl.textContent = 'Please select a piece of interest.';
      valid = false;
    } else {
      productErrEl.textContent = '';
    }

    if (!valid) return;

    submitBtn.disabled  = true;
    submitBtn.textContent = 'Sending…';
    formErrEl.textContent = '';

    const payload = {
      name:         fields.name.el.value.trim(),
      email:        fields.email.el.value.trim(),
      phone:        document.getElementById('enq-phone').value.trim(),
      weddingDate:  fields.weddingDate.el.value,
      venueName:    fields.venueName.el.value.trim(),
      venueCounty:  fields.venueCounty.el.value.trim(),
      productSlugs,
      notes:        document.getElementById('enq-notes').value.trim(),
    };

    try {
      const res = await fetch('/api/enquiry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      const pieceLabels = [...form.querySelectorAll('input[name="productSlug"]:checked')]
        .map(el => el.closest('label').querySelector('.enq-radio-text').textContent.trim());

      const formattedDate = new Date(payload.weddingDate).toLocaleDateString('en-IE', {
        day: 'numeric', month: 'long', year: 'numeric',
      });

      document.getElementById('enq-success-name').textContent   = payload.name;
      document.getElementById('enq-success-email').textContent  = payload.email;
      document.getElementById('enq-success-date').textContent   = formattedDate;
      document.getElementById('enq-success-venue').textContent  = `${payload.venueName}, ${payload.venueCounty}`;
      document.getElementById('enq-success-pieces').textContent = pieceLabels.join(' & ');

      form.hidden      = true;
      successEl.hidden = false;
      successEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      formErrEl.textContent  = err.message;
      submitBtn.disabled     = false;
      submitBtn.innerHTML    = originalBtnHTML;
    }
  });
})();
