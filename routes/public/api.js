'use strict';

const express = require('express');
const router = express.Router();
const { checkAvailability } = require('../../services/shared/availabilityService');
const prisma = require('../../lib/prisma');

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

// POST /api/enquiry
router.post('/enquiry', async (req, res) => {
  const { name, email, phone, weddingDate, venueName, venueCounty, productSlugs, notes } = req.body || {};

  if (!name || !email || !weddingDate || !venueName || !venueCounty || !Array.isArray(productSlugs) || !productSlugs.length) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const weddingDateObj = new Date(weddingDate);
  if (isNaN(weddingDateObj.getTime())) {
    return res.status(400).json({ error: 'Invalid wedding date.' });
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: productSlugs }, isActive: true },
    select: { id: true },
  });

  if (!products.length) return res.status(400).json({ error: 'Product not found.' });

  const productIds = products.map(p => p.id);

  const customer = await prisma.customer.create({
    data: { name, email, phone: phone || null },
  });

  await prisma.enquiry.create({
    data: {
      customerId: customer.id,
      source:     'CUSTOMER_FORM',
      status:     'NEW',
      hireStartDate: weddingDateObj,
      venueName,
      venueCounty,
      notes: notes || null,
      items: {
        create: productIds.map(id => ({ productId: id, quantity: 1 })),
      },
    },
  });

  return res.json({ success: true });
});

module.exports = router;
