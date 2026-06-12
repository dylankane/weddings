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
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { displayOrder: 'asc' },
  });

  res.render('public/pages/collection.njk', { products });
});

module.exports = router;
