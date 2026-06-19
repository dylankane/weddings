'use strict';

/* ─────────────────────────────────────────────────────────────────
   POSTA ADMIN — Products JS
───────────────────────────────────────────────────────────────── */

// ─── Inline Detail Panels ────────────────────────────────────────

let openDetail = null;

document.querySelectorAll('.js-product-row').forEach(row => {
  row.addEventListener('click', () => {
    const detail = row.nextElementSibling;
    if (!detail || !detail.classList.contains('product-detail')) return;

    const isOpen = detail.classList.contains('is-open');

    if (openDetail && openDetail !== detail) {
      openDetail.classList.remove('is-open');
      openDetail.setAttribute('aria-hidden', 'true');
      openDetail.previousElementSibling.classList.remove('is-open');
      openDetail.previousElementSibling.setAttribute('aria-expanded', 'false');
    }

    detail.classList.toggle('is-open', !isOpen);
    detail.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    row.classList.toggle('is-open', !isOpen);
    row.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    openDetail = !isOpen ? detail : null;
  });
});

// ─── Inline Active Toggle ────────────────────────────────────────

document.querySelectorAll('.js-product-active').forEach(label => {
  label.addEventListener('click', e => e.stopPropagation());

  label.querySelector('input').addEventListener('change', async function () {
    const id      = label.dataset.id;
    const checked = this.checked;

    try {
      const res  = await fetch(`/admin/products/${id}/toggle-active`, { method: 'POST' });
      const data = await res.json();
      this.checked = data.isActive;
    } catch {
      this.checked = !checked;
    }
  });
});

// ─── Lightbox ────────────────────────────────────────────────────

const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

function openLightbox(src, alt) {
  if (!lightbox) return;
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lightboxImg.src = '';
}

document.querySelectorAll('.js-lightbox-thumb').forEach(thumb => {
  thumb.addEventListener('click', e => {
    e.stopPropagation();
    openLightbox(thumb.src, thumb.alt);
  });
});

if (lightbox) {
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox || e.target === lightboxImg) closeLightbox();
  });
}

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && lightbox && lightbox.classList.contains('is-open')) closeLightbox();
});

// ─── Delete Confirm ──────────────────────────────────────────────

document.querySelectorAll('.js-delete-form').forEach(form => {
  form.addEventListener('submit', e => {
    if (!confirm('Delete this product? This cannot be undone.')) e.preventDefault();
  });
});

// ─── Image Cards ─────────────────────────────────────────────────

const imageList = document.getElementById('image-list');
const dropZone  = document.getElementById('img-drop-zone');
const fileInput = document.getElementById('img-file-input');
const delList   = document.getElementById('image-delete-list');

if (dropZone && fileInput) {

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('keydown', e => {
    if (e.target === dropZone && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      fileInput.click();
    }
  });

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('is-dragging');
  });

  dropZone.addEventListener('dragleave', e => {
    if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('is-dragging');
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('is-dragging');
    [...e.dataTransfer.files].filter(f => f.type.startsWith('image/')).forEach(buildImageCard);
  });

  fileInput.addEventListener('change', () => {
    [...fileInput.files].forEach(buildImageCard);
    fileInput.value = '';
  });
}

function buildImageCard(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const card = document.createElement('div');
    card.className = 'img-card';
    card.dataset.type = 'new';

    card.innerHTML = `
      <input type="hidden" name="cardType[]" value="new">
      <input type="hidden" name="cardId[]" value="">
      <div class="img-card-preview">
        <img class="img-card-thumb" src="${e.target.result}" alt="" loading="lazy">
      </div>
      <div class="img-card-body">
        <div class="form-group">
          <label class="form-label">Alt text</label>
          <input class="form-input" type="text" name="cardAlt[]">
        </div>
        <div class="img-card-actions">
          <span class="img-card-cover">COVER IMAGE</span>
          <div class="img-card-right">
            <div class="img-card-order">
              <button type="button" class="btn js-img-up" aria-label="Move up">
                <svg class="btn-svg" aria-hidden="true"><use href="#icon-chevron-up"></use></svg>
              </button>
              <button type="button" class="btn js-img-down" aria-label="Move down">
                <svg class="btn-svg" aria-hidden="true"><use href="#icon-chevron-down"></use></svg>
              </button>
            </div>
            <button type="button" class="btn js-img-remove">
              <svg class="btn-svg" aria-hidden="true"><use href="#icon-delete"></use></svg>
              Remove
            </button>
          </div>
        </div>
      </div>
    `;

    // Attach file to a hidden input so it submits with the form
    const fi = document.createElement('input');
    fi.type  = 'file';
    fi.name  = 'imageFile';
    fi.style.display = 'none';
    const dt = new DataTransfer();
    dt.items.add(file);
    fi.files = dt.files;
    card.appendChild(fi);

    if (imageList) imageList.appendChild(card);
  };
  reader.readAsDataURL(file);
}

if (imageList) {
  imageList.addEventListener('click', e => {
    const card = e.target.closest('.img-card');
    if (!card) return;

    if (e.target.closest('.js-img-up')) {
      const prev = card.previousElementSibling;
      if (prev && prev.classList.contains('img-card')) imageList.insertBefore(card, prev);
      return;
    }

    if (e.target.closest('.js-img-down')) {
      const next = card.nextElementSibling;
      if (next && next.classList.contains('img-card')) imageList.insertBefore(next, card);
      return;
    }

    if (e.target.closest('.js-img-remove')) {
      const idInput = card.querySelector('input[name="cardId[]"]');
      if (idInput && idInput.value && delList) {
        const h = document.createElement('input');
        h.type  = 'hidden';
        h.name  = 'deleteImageId';
        h.value = idInput.value;
        delList.appendChild(h);
      }
      card.remove();
    }
  });
}

// ─── Option Rows ─────────────────────────────────────────────────

const optList       = document.getElementById('option-list');
const addOptionBtn  = document.getElementById('add-option-btn');
const optTemplate   = document.getElementById('opt-row-template');
const optDeleteList = document.getElementById('option-delete-list');

if (addOptionBtn && optTemplate) {
  addOptionBtn.addEventListener('click', () => {
    const clone = optTemplate.content.cloneNode(true);
    optList.appendChild(clone);
  });
}

if (optList) {
  optList.addEventListener('click', e => {
    if (!e.target.classList.contains('js-remove-opt')) return;
    const row = e.target.closest('.opt-row');
    if (!row) return;
    const idInput = row.querySelector('input[name="optionId[]"]');
    if (idInput && idInput.value && optDeleteList) {
      const hidden = document.createElement('input');
      hidden.type  = 'hidden';
      hidden.name  = 'deleteOptionId';
      hidden.value = idInput.value;
      optDeleteList.appendChild(hidden);
    }
    row.remove();
  });

  optList.addEventListener('change', e => {
    if (!e.target.classList.contains('js-opt-active')) return;
    const row = e.target.closest('.opt-row');
    if (!row) return;
    const hidden = row.querySelector('input[name="optionActive[]"]');
    if (hidden) hidden.value = e.target.checked ? '1' : '0';
  });
}

// ─── Slug Auto-generation (new product only) ─────────────────────

const nameInput = document.getElementById('name');
const slugInput = document.getElementById('slug');

if (nameInput && slugInput) {
  nameInput.addEventListener('input', () => {
    if (slugInput.dataset.manual) return;
    slugInput.value = nameInput.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  });
  slugInput.addEventListener('input', () => {
    slugInput.dataset.manual = slugInput.value ? 'true' : '';
  });
}
