'use strict';

// ─── View table total ─────────────────────────────────────────────

function recalcPricingTotal() {
  const subtotals = document.querySelectorAll('.js-pricing-subtotal');
  const total = Array.from(subtotals).reduce((sum, el) => sum + parseFloat(el.dataset.value || 0), 0);
  const totalEl = document.getElementById('js-pricing-total');
  if (totalEl) totalEl.textContent = '€' + total.toFixed(2);
}

recalcPricingTotal();
window.recalcPricingTotal = recalcPricingTotal;

// ─── Edit table ───────────────────────────────────────────────────

function recalcEditTotal() {
  const subtotals = document.querySelectorAll('#js-pricing-edit-body .js-edit-subtotal');
  const total = Array.from(subtotals).reduce((sum, el) => sum + parseFloat(el.dataset.value || 0), 0);
  const totalEl = document.getElementById('js-edit-total');
  if (totalEl) totalEl.textContent = '€' + total.toFixed(2);
}

function updateRowSubtotal(row) {
  const qty   = parseFloat(row.querySelector('.js-row-qty').value)   || 0;
  const price = parseFloat(row.querySelector('.js-row-price').value) || 0;
  const subtotal = qty * price;
  const cell = row.querySelector('.js-edit-subtotal');
  cell.dataset.value = subtotal;
  cell.textContent   = '€' + subtotal.toFixed(2);
  recalcEditTotal();
}

function initEditRow(row) {
  row.querySelector('.js-row-qty').addEventListener('input',   () => updateRowSubtotal(row));
  row.querySelector('.js-row-price').addEventListener('input', () => updateRowSubtotal(row));
}

const editBody = document.getElementById('js-pricing-edit-body');

if (editBody) {
  editBody.querySelectorAll('tr').forEach(row => {
    if (row.querySelector('.js-row-qty')) initEditRow(row);
  });

  recalcEditTotal();

  const addRowBtn = document.getElementById('js-pricing-add-row');
  if (addRowBtn) {
    addRowBtn.addEventListener('click', () => {
      const spacer = document.getElementById('js-edit-spacer-row');
      let nextRow  = parseInt(editBody.dataset.nextRow, 10);

      const tr = document.createElement('tr');
      tr.className = 'tr--static';
      tr.innerHTML = `
        <td><input class="form-input" type="text" name="rows[${nextRow}][description]"></td>
        <td class="td--center"><input class="form-input js-row-qty" type="number" name="rows[${nextRow}][qty]" value="1" min="1"></td>
        <td class="td--center"><input class="form-input js-row-price" type="number" name="rows[${nextRow}][unitPrice]" step="0.01" min="0" placeholder="0.00"></td>
        <td class="js-edit-subtotal td--center" data-value="0">€0.00</td>
      `;
      spacer.parentNode.insertBefore(tr, spacer);
      initEditRow(tr);
      editBody.dataset.nextRow = nextRow + 1;
    });
  }
}
