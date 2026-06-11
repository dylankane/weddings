'use strict';

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

router.use(async (req, res, next) => {
  try {
    res.locals.companySettings = await prisma.companySettings.findFirst();
  } catch {
    res.locals.companySettings = null;
  }
  next();
});

router.get('/home-preview', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    orderBy: { displayOrder: 'asc' },
    take: 3,
  });
  res.render('public/home.njk', { products });
});

module.exports = router;
