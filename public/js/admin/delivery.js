'use strict';

const venueDropdown  = document.getElementById('venue-search-dropdown');
const resultsList    = document.getElementById('venue-results-list');
const findVenueBtn   = document.getElementById('js-find-venue');
const findVenueLabel = document.getElementById('js-find-venue-label');
const mapsDisplay    = document.getElementById('venue-maps-display');
const copyMapsBtn    = document.getElementById('js-copy-maps-url');
const calcSaveRow    = document.getElementById('js-calc-save-row');
const calcSaveBtn    = document.getElementById('js-save-calculator');
const calcSection    = calcSaveBtn && calcSaveBtn.closest('[data-job-id]');
const jobId          = calcSection && calcSection.dataset.jobId;

let calcState = null;

if (calcSaveBtn) {
  calcSaveBtn.addEventListener('click', async () => {
    if (!calcState || !jobId) return;
    calcSaveBtn.disabled = true;

    try {
      const res  = await fetch(`/admin/jobs/${jobId}/calculator`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(calcState),
      });
      const data = await res.json();
      if (data.ok) {
        updateViewSections(data);
        if (calcSaveRow) calcSaveRow.classList.add('section-actions--hidden');
      }
    } catch (err) {
      console.error('Save to job failed:', err);
    } finally {
      calcSaveBtn.disabled = false;
    }
  });
}

function updateViewSections(data) {
  setView('view-venue-name',    calcState.venueName);
  setView('view-venue-county',  calcState.venueCounty);
  setView('view-venue-address', calcState.venueAddress);
  setView('view-venue-eircode', calcState.venueEircode);

  const price = Number(calcState.suggestedPrice || 0);
  const formatted = '€' + price.toFixed(2);

  let deliveryRow = document.getElementById('js-pricing-delivery-row');
  if (!deliveryRow) {
    const spacer = document.getElementById('js-pricing-spacer-row');
    deliveryRow = document.createElement('tr');
    deliveryRow.id = 'js-pricing-delivery-row';
    deliveryRow.className = 'tr--static';
    deliveryRow.innerHTML = `<td>Delivery</td><td class="td--center">1</td><td class="td--center"></td><td class="js-pricing-subtotal td--center" data-value="0"></td>`;
    spacer.parentNode.insertBefore(deliveryRow, spacer);
  }

  deliveryRow.cells[2].textContent = formatted;
  const subtotalCell = deliveryRow.querySelector('.js-pricing-subtotal');
  subtotalCell.dataset.value = price;
  subtotalCell.textContent   = formatted;

  document.dispatchEvent(new CustomEvent('pricing:recalc'));
}

function setView(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value || '—';
  if (value) el.classList.remove('field-value--empty');
}

if (copyMapsBtn) {
  copyMapsBtn.addEventListener('click', async () => {
    const url = mapsDisplay && mapsDisplay.getAttribute('href');
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      copyMapsBtn.classList.add('field-label--copied');
      setTimeout(() => copyMapsBtn.classList.remove('field-label--copied'), 1500);
    } catch (_) {}
  });
}

document.addEventListener('click', e => {
  if (venueDropdown && !venueDropdown.contains(e.target)) {
    venueDropdown.classList.remove('is-open');
  }
});

if (findVenueBtn) {
  findVenueBtn.addEventListener('click', e => {
    e.stopPropagation();
    findVenue();
  });
}

async function findVenue() {
  const venueName    = getVal('venueName');
  const venueCounty  = getVal('venueCounty');
  const venueAddress = getVal('venueAddress');
  const venueEircode = getVal('venueEircode');

  if (!venueName && !venueCounty && !venueAddress && !venueEircode) {
    showDropdownMessage('Enter venue details in the delivery section first');
    return;
  }

  findVenueBtn.disabled = true;
  if (findVenueLabel) findVenueLabel.textContent = 'Searching…';

  try {
    const res  = await fetch('/admin/api/venue-search', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ venueName, venueCounty, venueAddress, venueEircode })
    });
    const data = await res.json();
    showResults(data.results || []);
  } catch (_) {
    showDropdownMessage('Search unavailable');
  } finally {
    findVenueBtn.disabled = false;
    if (findVenueLabel) findVenueLabel.textContent = 'Find venue';
  }
}

function showResults(results) {
  resultsList.innerHTML = '';
  venueDropdown.classList.add('is-open');

  if (results.length === 0) {
    showDropdownMessage('No venues found');
    return;
  }

  const placeholder = document.createElement('li');
  placeholder.className = 'form-dropdown-option';
  placeholder.setAttribute('aria-disabled', 'true');
  placeholder.style.pointerEvents = 'none';
  placeholder.textContent = '—';
  resultsList.appendChild(placeholder);

  results.forEach(venue => {
    const li = document.createElement('li');
    li.className = 'form-dropdown-option';
    li.setAttribute('role', 'option');
    li.setAttribute('tabindex', '-1');
    li.textContent = venue.name + ' — ' + venue.address;
    li.addEventListener('click', e => {
      e.stopPropagation();
      venueDropdown.classList.remove('is-open');
      applyVenue(venue);
    });
    resultsList.appendChild(li);
  });
}

function showDropdownMessage(msg) {
  resultsList.innerHTML = '';
  venueDropdown.classList.add('is-open');
  const li = document.createElement('li');
  li.className = 'form-dropdown-option';
  li.style.pointerEvents = 'none';
  li.textContent = msg;
  resultsList.appendChild(li);
}

function applyVenue(venue) {
  const resultDisplay = document.getElementById('venue-result-display');
  if (resultDisplay) {
    resultDisplay.textContent = venue.name + ', ' + venue.address;
    resultDisplay.classList.remove('field-value--empty');
  }

  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venue.address);
  if (mapsDisplay) {
    mapsDisplay.href        = mapsUrl;
    mapsDisplay.textContent = mapsUrl;
    mapsDisplay.classList.remove('field-value--empty');
  }

  calcState = {
    venueName:        venue.name,
    venueCounty:      venue.county,
    venueAddress:     venue.address,
    venueEircode:     venue.eircode,
    lat:              venue.lat,
    lng:              venue.lng,
    mapsUrl,
    calculatorResult: venue.name + ', ' + venue.address,
  };

  setVal('venueName',    venue.name);
  setVal('venueCounty',  venue.county);
  setVal('venueAddress', venue.address);
  setVal('venueEircode', venue.eircode);
  setVal('deliveryLat',  venue.lat);
  setVal('deliveryLng',  venue.lng);

  if (venue.lat && venue.lng) getDistance(venue.lat, venue.lng);
}

async function getDistance(lat, lng) {
  document.querySelectorAll('.js-calc-row').forEach(row => { row.hidden = false; });
  setCalcText('Calculating…', 'Calculating…', 'Calculating…', 'Calculating…');

  try {
    const res  = await fetch('/admin/api/venue-distance', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ venueLat: lat, venueLng: lng })
    });
    const data = await res.json();
    applyCalc(data);
  } catch (_) {
    setCalcText('—', '—', '—', '—');
  }
}

function applyCalc(data) {
  const distanceText = data.distanceKm   ? data.distanceKm + ' km'                             : '—';
  const durationText = data.durationMins ? formatDuration(data.durationMins)                    : '—';
  const tierText     = data.zone         ? data.zone.name                                       : 'No matching tier';
  const priceText    = data.zone && data.zone.price ? '€' + Number(data.zone.price).toFixed(2) : '—';

  setCalcText(distanceText, durationText, tierText, priceText);

  if (data.zone && data.zone.price) {
    applyPricing(data.zone);
    if (calcState) {
      calcState.distanceKm     = data.distanceKm;
      calcState.durationMins   = data.durationMins;
      calcState.suggestedPrice = data.zone.price;
      calcState.deliveryCost   = data.zone.price;
      calcState.deliveryZoneId = data.zone.id;
    }
    if (calcSaveRow) calcSaveRow.classList.remove('section-actions--hidden');
  }
}

function setCalcText(distance, duration, tier, price) {
  document.querySelectorAll('.js-calc-distance').forEach(el => { el.textContent = distance; });
  document.querySelectorAll('.js-calc-duration').forEach(el => { el.textContent = duration; });
  document.querySelectorAll('.js-calc-tier').forEach(el => { el.textContent = tier; });
  document.querySelectorAll('.js-calc-price').forEach(el => { el.textContent = price; });
}

function applyPricing(zone) {
  const deliveryCostEl = document.getElementById('deliveryCost');
  if (deliveryCostEl) deliveryCostEl.value = Number(zone.price).toFixed(2);

  const zoneInput = document.getElementById('pricingZoneId');
  if (zoneInput) zoneInput.value = zone.id;
}

function formatDuration(mins) {
  if (mins < 60) return mins + ' mins';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? h + 'h ' + m + 'min' : h + 'h';
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val != null) el.value = val;
}
