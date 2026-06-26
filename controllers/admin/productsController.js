'use strict';

const path   = require('path');
const fs     = require('fs');
const prisma = require('../../lib/prisma');

const PRODUCT_INCLUDE = {
  images:               { orderBy: { displayOrder: 'asc' } },
  customisationOptions: { orderBy: { displayOrder: 'asc' } },
};

function toArray(val) {
  if (val === undefined || val === null) return [];
  return Array.isArray(val) ? val : [val];
}

function deleteFile(url) {
  if (!url) return;
  try {
    const fp = path.join(__dirname, '../../public', url);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  } catch {}
}

// ─── List ─────────────────────────────────────────────────────────────────────

async function list(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        ...PRODUCT_INCLUDE,
        _count: { select: { jobItems: true } },
      },
    });

    return res.render('admin/products/list.njk', {
      title:       'Products',
      currentPage: 'products',
      products,
      error:       req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
}

// ─── New ──────────────────────────────────────────────────────────────────────

async function newProduct(req, res, next) {
  try {
    return res.render('admin/products/new.njk', {
      title:       'New Product',
      currentPage: 'products',
      product: {
        name: '', slug: '', description: '',
        stockQuantity: 1, displayOrder: 0,
        isActive: true, isCustomisable: false,
        pricePerEvent: null, pricePerDay: null,
        images: [], customisationOptions: [],
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Edit ─────────────────────────────────────────────────────────────────────

async function editProduct(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });

    if (!product) return next({ status: 404, message: 'Product not found' });

    return res.render('admin/products/edit.njk', {
      title:       `Edit — ${product.name}`,
      currentPage: 'products',
      product,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

async function create(req, res, next) {
  const b = req.body;

  try {
    const product = await prisma.product.create({
      data: {
        name:          b.name,
        slug:          b.slug,
        description:   b.description,
        stockQuantity: parseInt(b.stockQuantity, 10) || 0,
        displayOrder:  parseInt(b.displayOrder, 10)  || 0,
        isActive:      b.isActive      === 'on',
        isCustomisable: b.isCustomisable === 'on',
        pricePerEvent: b.pricePerEvent ? parseFloat(b.pricePerEvent) : null,
        pricePerDay:   b.pricePerDay   ? parseFloat(b.pricePerDay)   : null,
      },
    });

    // ── Images ──────────────────────────────────────────────────────

    const cardTypes = toArray(b.cardType);
    const cardAlts  = toArray(b.cardAlt);
    let fileIdx = 0;

    for (let i = 0; i < cardTypes.length; i++) {
      if (cardTypes[i] !== 'new') continue;
      const file = req.files && req.files[fileIdx++];
      if (!file) continue;
      await prisma.productImage.create({
        data: {
          productId:    product.id,
          url:          `/uploads/products/${file.filename}`,
          altText:      cardAlts[i] || null,
          displayOrder: i,
          isPrimary:    i === 0,
        },
      });
    }

    return res.redirect('/admin/products');
  } catch (err) {
    next(err);
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

async function update(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });

  const b = req.body;

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name:          b.name,
        slug:          b.slug,
        description:   b.description,
        stockQuantity: parseInt(b.stockQuantity, 10) || 0,
        displayOrder:  parseInt(b.displayOrder, 10)  || 0,
        isActive:      b.isActive      === 'on',
        isCustomisable: b.isCustomisable === 'on',
        pricePerEvent: b.pricePerEvent ? parseFloat(b.pricePerEvent) : null,
        pricePerDay:   b.pricePerDay   ? parseFloat(b.pricePerDay)   : null,
      },
    });

    // ── Images ──────────────────────────────────────────────────────

    const delImgIds = toArray(b.deleteImageId).filter(Boolean).map(Number);
    for (const delId of delImgIds) {
      const img = await prisma.productImage.findUnique({ where: { id: delId } });
      if (img) {
        deleteFile(img.url);
        await prisma.productImage.delete({ where: { id: delId } });
      }
    }

    const cardTypes = toArray(b.cardType);
    const cardIds   = toArray(b.cardId);
    const cardAlts  = toArray(b.cardAlt);
    let fileIdx = 0;

    for (let i = 0; i < cardTypes.length; i++) {
      const type      = cardTypes[i];
      const altText   = cardAlts[i] || null;
      const isPrimary = i === 0;

      if (type === 'existing') {
        const imgId = parseInt(cardIds[i], 10);
        if (!imgId) continue;
        await prisma.productImage.update({
          where: { id: imgId },
          data: { altText, displayOrder: i, isPrimary },
        });
      } else if (type === 'new') {
        const file = req.files && req.files[fileIdx++];
        if (!file) continue;
        await prisma.productImage.create({
          data: {
            productId:    id,
            url:          `/uploads/products/${file.filename}`,
            altText,
            displayOrder: i,
            isPrimary,
          },
        });
      }
    }

    // ── Options ─────────────────────────────────────────────────────

    const delOptIds = toArray(b.deleteOptionId).filter(Boolean).map(Number);
    if (delOptIds.length) {
      await prisma.productCustomisationOption.deleteMany({ where: { id: { in: delOptIds } } });
    }

    const optIds     = toArray(b.optionId);
    const optNames   = toArray(b.optionName);
    const optDescs   = toArray(b.optionDesc);
    const optPrices  = toArray(b.optionPrice);
    const optActives = toArray(b.optionActive);

    for (let i = 0; i < optNames.length; i++) {
      if (!optNames[i]) continue;

      const data = {
        name:         optNames[i],
        description:  optDescs[i]  || null,
        basePrice:    optPrices[i] ? parseFloat(optPrices[i]) : null,
        isActive:     optActives[i] === '1',
        displayOrder: i,
        productId:    id,
      };

      if (optIds[i]) {
        await prisma.productCustomisationOption.update({ where: { id: parseInt(optIds[i], 10) }, data });
      } else {
        await prisma.productCustomisationOption.create({ data });
      }
    }

    return res.redirect('/admin/products');
  } catch (err) {
    next(err);
  }
}

// ─── Toggle Active ────────────────────────────────────────────────────────────

async function toggleActive(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });

  try {
    const product = await prisma.product.findUnique({ where: { id }, select: { isActive: true } });
    if (!product) return next({ status: 404 });

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      select: { isActive: true },
    });

    return res.json({ isActive: updated.isActive });
  } catch (err) {
    next(err);
  }
}

// ─── Toggle Customisable ──────────────────────────────────────────────────────

async function toggleCustomisable(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });

  try {
    const product = await prisma.product.findUnique({ where: { id }, select: { isCustomisable: true } });
    if (!product) return next({ status: 404 });

    const updated = await prisma.product.update({
      where: { id },
      data:  { isCustomisable: !product.isCustomisable },
      select: { isCustomisable: true },
    });

    return res.json({ isCustomisable: updated.isCustomisable });
  } catch (err) {
    next(err);
  }
}

// ─── Toggle Option Active ─────────────────────────────────────────────────────

async function toggleOptionActive(req, res, next) {
  const optId = parseInt(req.params.optionId, 10);
  if (isNaN(optId)) return next({ status: 404 });

  try {
    const opt = await prisma.productCustomisationOption.findUnique({ where: { id: optId }, select: { isActive: true } });
    if (!opt) return next({ status: 404 });

    const updated = await prisma.productCustomisationOption.update({
      where: { id: optId },
      data:  { isActive: !opt.isActive },
      select: { isActive: true },
    });

    return res.json({ isActive: updated.isActive });
  } catch (err) {
    next(err);
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteProduct(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });

  try {
    const inUse = await prisma.jobItem.count({ where: { productId: id } });
    if (inUse > 0) return res.redirect('/admin/products?error=in-use');

    const images = await prisma.productImage.findMany({ where: { productId: id } });
    images.forEach(img => deleteFile(img.url));

    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.productCustomisationOption.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    return res.redirect('/admin/products');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, newProduct, editProduct, create, update, toggleActive, toggleCustomisable, toggleOptionActive, deleteProduct };
