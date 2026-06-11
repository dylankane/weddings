'use strict';

const prisma = require('../../../lib/prisma');
const { createAuditLog } = require('../../../models/auditLog');
const storageService = require('../../../services/admin/storageService');
const slugify = require('slugify');

async function list(req, res) {
  const products = await prisma.product.findMany({
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { bookingItems: true, enquiryItems: true } },
    },
    orderBy: [{ isActive: 'desc' }, { displayOrder: 'asc' }],
  });

  res.render('admin/products/list.njk', {
    title: 'Products',
    products,
    section: 'products',
  });
}

async function detail(req, res) {
  const id = parseInt(req.params.id);
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { displayOrder: 'asc' } },
      customisationOptions: { orderBy: { displayOrder: 'asc' } },
    },
  });

  if (!product) return res.status(404).render('errors/404.njk', { title: 'Product Not Found' });

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'Product', entityId: id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  res.render('admin/products/detail.njk', {
    title: product.name,
    product,
    auditLogs,
    mode: 'detail',
    section: 'products',
  });
}

async function showEdit(req, res) {
  const id = parseInt(req.params.id);
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { displayOrder: 'asc' } },
      customisationOptions: { orderBy: { displayOrder: 'asc' } },
    },
  });

  if (!product) return res.status(404).render('errors/404.njk', { title: 'Product Not Found' });

  res.render('admin/products/edit.njk', {
    title: `Edit â€” ${product.name}`,
    product,
    mode: 'edit',
    section: 'products',
    errors: null,
  });
}

async function update(req, res) {
  const id = parseInt(req.params.id);
  const {
    name, description, stockQuantity,
    isCustomisable, customisationOverview, displayOrder,
  } = req.body;

  await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      stockQuantity: parseInt(stockQuantity),
      isCustomisable: isCustomisable === 'on',
      customisationOverview: customisationOverview || null,
      displayOrder: parseInt(displayOrder) || 0,
    },
  });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'PRODUCT_UPDATED',
    entityType: 'Product',
    entityId: id,
  });

  res.redirect(`/admin/products/${id}`);
}

async function showCreate(req, res) {
  res.render('admin/products/create.njk', {
    title: 'New Product',
    section: 'products',
    errors: null,
  });
}

async function create(req, res) {
  const {
    name, description, stockQuantity,
    isCustomisable, customisationOverview, displayOrder,
  } = req.body;

  const slug = slugify(name, { lower: true, strict: true });

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      stockQuantity: parseInt(stockQuantity),
      isCustomisable: isCustomisable === 'on',
      customisationOverview: customisationOverview || null,
      displayOrder: parseInt(displayOrder) || 0,
    },
  });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'PRODUCT_CREATED',
    entityType: 'Product',
    entityId: product.id,
  });

  res.redirect(`/admin/products/${product.id}`);
}

async function deactivate(req, res) {
  const id = parseInt(req.params.id);

  await prisma.product.update({ where: { id }, data: { isActive: false } });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'PRODUCT_DEACTIVATED',
    entityType: 'Product',
    entityId: id,
  });

  res.redirect(`/admin/products/${id}`);
}

async function uploadImage(req, res) {
  const productId = parseInt(req.params.id);

  if (!req.file) return res.redirect(`/admin/products/${productId}`);

  const url = await storageService.saveFile(req.file);
  const altText = req.body.altText || '';

  const hasImages = await prisma.productImage.count({ where: { productId } });

  await prisma.productImage.create({
    data: {
      productId,
      url,
      altText,
      isPrimary: hasImages === 0,
      displayOrder: hasImages,
    },
  });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'PRODUCT_IMAGE_UPLOADED',
    entityType: 'Product',
    entityId: productId,
  });

  res.redirect(`/admin/products/${productId}/edit`);
}

async function deleteImage(req, res) {
  const productId = parseInt(req.params.id);
  const imageId = parseInt(req.params.imageId);

  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) return res.redirect(`/admin/products/${productId}`);

  await storageService.deleteFile(image.url);
  await prisma.productImage.delete({ where: { id: imageId } });

  // If deleted image was primary, promote next image
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({ where: { productId }, orderBy: { displayOrder: 'asc' } });
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  res.redirect(`/admin/products/${productId}/edit`);
}

async function setPrimaryImage(req, res) {
  const productId = parseInt(req.params.id);
  const imageId = parseInt(req.params.imageId);

  await prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
  await prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });

  res.redirect(`/admin/products/${productId}/edit`);
}

module.exports = { list, detail, showEdit, update, showCreate, create, deactivate, uploadImage, deleteImage, setPrimaryImage };



