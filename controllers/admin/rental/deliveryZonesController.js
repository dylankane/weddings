'use strict';

const prisma = require('../../../lib/prisma');
const { createAuditLog } = require('../../../models/auditLog');

async function list(req, res) {
  const zones = await prisma.deliveryZone.findMany({
    orderBy: [{ isActive: 'desc' }, { displayOrder: 'asc' }],
  });

  res.render('admin/delivery-zones/list.njk', {
    title: 'Delivery Zones',
    zones,
    section: 'settings',
  });
}

async function showCreate(req, res) {
  res.render('admin/delivery-zones/create.njk', {
    title: 'New Delivery Zone',
    section: 'settings',
    errors: null,
  });
}

async function create(req, res) {
  const {
    name, description, zoneType, price, isEnquireOnly, displayOrder,
    centerLat, centerLng, radiusKm,
  } = req.body;

  await prisma.deliveryZone.create({
    data: {
      name,
      description: description || null,
      zoneType,
      price: isEnquireOnly === 'on' ? null : (price ? parseFloat(price) : null),
      isEnquireOnly: isEnquireOnly === 'on',
      displayOrder: parseInt(displayOrder) || 0,
      centerLat: centerLat ? parseFloat(centerLat) : null,
      centerLng: centerLng ? parseFloat(centerLng) : null,
      radiusKm: radiusKm ? parseFloat(radiusKm) : null,
    },
  });

  res.redirect('/admin/delivery-zones');
}

async function showEdit(req, res) {
  const id = parseInt(req.params.id);
  const zone = await prisma.deliveryZone.findUnique({ where: { id } });

  if (!zone) return res.status(404).render('errors/404.njk', { title: 'Zone Not Found' });

  res.render('admin/delivery-zones/edit.njk', {
    title: `Edit â€” ${zone.name}`,
    zone,
    section: 'settings',
    errors: null,
  });
}

async function update(req, res) {
  const id = parseInt(req.params.id);
  const {
    name, description, zoneType, price, isEnquireOnly, displayOrder,
    centerLat, centerLng, radiusKm,
  } = req.body;

  await prisma.deliveryZone.update({
    where: { id },
    data: {
      name,
      description: description || null,
      zoneType,
      price: isEnquireOnly === 'on' ? null : (price ? parseFloat(price) : null),
      isEnquireOnly: isEnquireOnly === 'on',
      displayOrder: parseInt(displayOrder) || 0,
      centerLat: centerLat ? parseFloat(centerLat) : null,
      centerLng: centerLng ? parseFloat(centerLng) : null,
      radiusKm: radiusKm ? parseFloat(radiusKm) : null,
    },
  });

  res.redirect('/admin/delivery-zones');
}

async function deactivate(req, res) {
  const id = parseInt(req.params.id);

  await prisma.deliveryZone.update({ where: { id }, data: { isActive: false } });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'DELIVERY_ZONE_DEACTIVATED',
    entityType: 'DeliveryZone',
    entityId: id,
  });

  res.redirect('/admin/delivery-zones');
}

module.exports = { list, showCreate, create, showEdit, update, deactivate };

