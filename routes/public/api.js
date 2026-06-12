'use strict';

const express = require('express');
const router = express.Router();
const { checkAvailability } = require('../../services/shared/availabilityService');

// GET /api/availability?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/availability', async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'start and end query parameters are required.' });
  }

  const startDate = new Date(start);
  const endDate   = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  if (endDate < startDate) {
    return res.status(400).json({ error: 'end date must be on or after start date.' });
  }

  const products = await checkAvailability({ start: startDate, end: endDate });
  res.json({ products });
});

module.exports = router;
