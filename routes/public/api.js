'use strict';

const express = require('express');
const router  = express.Router();
const prisma  = require('../../lib/prisma');

// GET /api/availability
router.get('/availability', async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end are required.' });
  res.json({ products: [] });
});

// POST /api/enquiry
router.post('/enquiry', async (req, res) => {
  const { name, email, phone, weddingDate, venueName, venueCounty, venueAddress, productSlugs, notes } = req.body || {};

  if (!name || !email || !weddingDate || !venueName || !venueCounty || !Array.isArray(productSlugs) || !productSlugs.length) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const weddingDateObj = new Date(weddingDate);
  if (isNaN(weddingDateObj.getTime())) return res.status(400).json({ error: 'Invalid date.' });

  const products = await prisma.product.findMany({
    where: { slug: { in: productSlugs }, isActive: true },
    select: { id: true },
  });

  if (!products.length) return res.status(400).json({ error: 'Product not found.' });

  const systemUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!systemUser) return res.status(500).json({ error: 'System not configured.' });

  await prisma.$transaction(async tx => {
    const enquiry = await tx.enquiry.create({
      data: {
        name,
        email,
        phone:        phone        || null,
        weddingDate:  weddingDateObj,
        venueName,
        venueCounty,
        venueAddress: venueAddress || null,
        productSlugs,
        notes:        notes        || null,
      },
    });

    const customer = await tx.customer.create({
      data: { name, email, phone: phone || null },
    });

    await tx.job.create({
      data: {
        customerId:  customer.id,
        enquiryId:   enquiry.id,
        createdById: systemUser.id,
        source:      'CUSTOMER_FORM',
        status:      'ENQUIRY',
        jobStart:    weddingDateObj,
        notes:       notes || null,
        items: {
          create: products.map(p => ({ productId: p.id })),
        },
        delivery: {
          create: {
            outboundMethod: 'STAFF',
            returnMethod:   'STAFF',
            venueName,
            venueCounty,
            venueAddress:   venueAddress || null,
          },
        },
      },
    });
  });

  return res.json({ success: true });
});

module.exports = router;
