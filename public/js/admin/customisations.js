'use strict';

document.addEventListener('click', e => {
  const btn = e.target.closest('.js-add-cus');
  if (!btn) return;

  const wrapper   = btn.closest('.js-item-customisations');
  const itemIndex = wrapper.dataset.itemIndex;
  const options   = JSON.parse(wrapper.dataset.options || '[]');

  if (!options.length) return;

  const existingIds = new Set(
    [...wrapper.querySelectorAll('[data-opt-id]')].map(el => el.dataset.optId)
  );
  const available = options.filter(o => !existingIds.has(String(o.id)));
  if (!available.length) return;

  const rowCount = wrapper.querySelectorAll('.js-cus-row').length;
  const row      = buildCusRow(available[0], itemIndex, rowCount + 1);
  wrapper.insertBefore(row, btn);
  renumberRows(wrapper);
});

function buildCusRow(opt, itemIndex, rowNum) {
  const row = document.createElement('div');
  row.className    = 'form-row form-row--sub js-cus-row';
  row.dataset.optId = opt.id;

  let descField;
  if (opt.type === 'BOOLEAN') {
    descField = `<select class="form-select" name="items[${itemIndex}][customisations][c${opt.id}]">
      <option value="">—</option>
      <option value="Yes">Yes</option>
      <option value="No">No</option>
    </select>`;
  } else if (opt.type === 'SELECT') {
    const choices = (opt.options || []).map(c => `<option>${c}</option>`).join('');
    descField = `<select class="form-select" name="items[${itemIndex}][customisations][c${opt.id}]">
      <option value="">—</option>
      ${choices}
    </select>`;
  } else {
    descField = `<input class="form-input" type="text"
      name="items[${itemIndex}][customisations][c${opt.id}]" value="">`;
  }

  const price = opt.basePrice != null ? opt.basePrice : '';

  row.innerHTML = `
    <div class="form-group">
      <label class="form-label js-cus-label">Customisation ${rowNum}</label>
      <span class="field-value">${opt.name}</span>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      ${descField}
    </div>
    <div class="form-group">
      <label class="form-label">Price</label>
      <input class="form-input" type="number" step="0.01" min="0"
        name="items[${itemIndex}][customisationPrices][c${opt.id}]"
        value="${price}" placeholder="0.00">
    </div>
  `;
  return row;
}

function renumberRows(wrapper) {
  wrapper.querySelectorAll('.js-cus-row .js-cus-label').forEach((lbl, i) => {
    lbl.textContent = `Customisation ${i + 1}`;
  });
}
