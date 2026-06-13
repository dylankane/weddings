'use strict';

const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

router.use(async (req, res, next) => {
  try {
    res.locals.companySettings = await prisma.companySettings.findFirst();
  } catch {
    res.locals.companySettings = null;
  }
  next();
});

router.get('/', (req, res) => {
  res.render('public/pages/index.njk');
});

router.get('/collection', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      images: { orderBy: { displayOrder: 'asc' }, take: 3 },
    },
    orderBy: { displayOrder: 'asc' },
  });

  res.render('public/pages/collection.njk', { products });
});

router.get('/contact', (req, res) => {
  res.render('public/pages/contact.njk');
});

router.get('/enquiry', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { displayOrder: 'asc' },
  });

  res.render('public/pages/enquiry.njk', { products });
});

module.exports = router;
