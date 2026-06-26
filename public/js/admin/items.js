'use strict';

const addBtn     = document.getElementById('js-add-item');
const productsEl = document.getElementById('js-products-data');
const products   = productsEl ? JSON.parse(productsEl.textContent) : [];

function itemRows() {
  return addBtn
    ? [...addBtn.parentElement.querySelectorAll('.form-row.form-row--items')]
    : [];
}

if (addBtn) {
  addBtn.addEventListener('click', () => {
    const row = buildRow(itemRows().length);
    addBtn.parentElement.insertBefore(row, addBtn);
    reindex();
  });

  addBtn.parentElement.addEventListener('click', e => {
    const btn = e.target.closest('.js-remove-item');
    if (btn) {
      btn.closest('.form-row').remove();
      reindex();
    }
  });
}

function buildRow(index) {
  const options = products.map(p =>
    `<option value="${p.id}">${p.name}</option>`
  ).join('');

  const row = document.createElement('div');
  row.className = 'form-row form-row--items';
  row.innerHTML = `
    <div class="form-group">
      <label class="form-label js-item-label">Product ${index + 1}</label>
      <select class="form-select" name="items[${index}][productId]" required>
        <option value="">Select product</option>
        ${options}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Qty</label>
      <input class="form-input" type="number" name="items[${index}][quantity]" value="1" min="1" required>
    </div>
    <div class="form-group">
      <label class="form-label">Price</label>
      <input class="form-input" type="number" name="items[${index}][unitPrice]" step="0.01" min="0" placeholder="0.00">
    </div>
  `;
  return row;
}

function reindex() {
  itemRows().forEach((row, i) => {
    row.querySelectorAll('[name]').forEach(el => {
      el.name = el.name.replace(/items\[\d+\]/, `items[${i}]`);
    });
    const label = row.querySelector('.js-item-label');
    if (label) label.textContent = `Product ${i + 1}`;

    const nested = row.nextElementSibling;
    if (nested && nested.classList.contains('js-item-customisations')) {
      nested.querySelectorAll('[name]').forEach(el => {
        el.name = el.name.replace(/items\[\d+\]/, `items[${i}]`);
      });
    }
  });
}
