'use strict';

const prisma = require('../../../lib/prisma');
const { createAuditLog } = require('../../../models/auditLog');
const deliveryService = require('../../../services/admin/deliveryService');

const VALID_STATUSES = ['PROVISIONAL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const PAGE_SIZE = 20;

async function list(req, res) {
  const { status, page = 1 } = req.query;
  const skip = (parseInt(page) - 1) * PAGE_SIZE;

  const where = {};
  if (status && VALID_STATUSES.includes(status)) {
    where.status = status;
  } else {
    where.status = { in: ['PROVISIONAL', 'CONFIRMED'] };
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
        deliveryZone: true,
      },
      orderBy: { hireStartDatetime: 'asc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  res.render('admin/bookings/list.njk', {
    title: 'Bookings',
    bookings,
    total,
    totalPages,
    currentPage: parseInt(page),
    activeStatus: status || 'active',
    section: 'bookings',
  });
}

async function detail(req, res) {
  const id = parseInt(req.params.id);
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      enquiry: true,
      items: {
        include: {
          product: true,
          customisations: { include: { customisationOption: true } },
        },
      },
      deliveryZone: true,
      createdBy: true,
      invoices: { include: { items: true, createdBy: true } },
    },
  });

  if (!booking) return res.status(404).render('errors/404.njk', { title: 'Booking Not Found' });

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'Booking', entityId: id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  res.render('admin/bookings/detail.njk', {
    title: `Booking #${id}`,
    booking,
    auditLogs,
    mode: 'detail',
    section: 'bookings',
  });
}

async function showEdit(req, res) {
  const id = parseInt(req.params.id);
  const [booking, products, deliveryZones, customers] = await Promise.all([
    prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true, customisations: { include: { customisationOption: true } } } },
        deliveryZone: true,
      },
    }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
    prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
    prisma.customer.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!booking) return res.status(404).render('errors/404.njk', { title: 'Booking Not Found' });

  res.render('admin/bookings/edit.njk', {
    title: `Edit Booking #${id}`,
    booking,
    products,
    deliveryZones,
    customers,
    mode: 'edit',
    section: 'bookings',
  });
}

async function update(req, res) {
  const id = parseInt(req.params.id);
  const {
    hireStartDatetime, hireEndDatetime,
    fulfillmentType, deliveryAddress, deliveryDatetime, collectionDatetime,
    deliveryZoneId, deliveryCost,
    provisionalExpiresAt, notes,
    itemsDelivered, itemsCollected,
  } = req.body;

  await prisma.booking.update({
    where: { id },
    data: {
      hireStartDatetime: new Date(hireStartDatetime),
      hireEndDatetime: new Date(hireEndDatetime),
      fulfillmentType,
      deliveryAddress: deliveryAddress || null,
      deliveryDatetime: deliveryDatetime ? new Date(deliveryDatetime) : null,
      collectionDatetime: collectionDatetime ? new Date(collectionDatetime) : null,
      deliveryZoneId: deliveryZoneId ? parseInt(deliveryZoneId) : null,
      deliveryCost: deliveryCost ? parseFloat(deliveryCost) : null,
      provisionalExpiresAt: provisionalExpiresAt ? new Date(provisionalExpiresAt) : null,
      notes: notes || null,
      itemsDelivered: itemsDelivered === 'on',
      itemsCollected: itemsCollected === 'on',
    },
  });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'BOOKING_UPDATED',
    entityType: 'Booking',
    entityId: id,
  });

  res.redirect(`/admin/bookings/${id}`);
}

async function showCreate(req, res) {
  const { enquiryId } = req.query;

  const [products, deliveryZones, customers] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
    prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
    prisma.customer.findMany({ orderBy: { name: 'asc' } }),
  ]);

  let enquiry = null;
  if (enquiryId) {
    enquiry = await prisma.enquiry.findUnique({
      where: { id: parseInt(enquiryId) },
      include: { customer: true, items: { include: { product: true } } },
    });
  }

  res.render('admin/bookings/create.njk', {
    title: 'New Booking',
    products,
    deliveryZones,
    customers,
    enquiry,
    section: 'bookings',
    errors: null,
  });
}

async function create(req, res) {
  const {
    customerId, enquiryId,
    status, hireStartDatetime, hireEndDatetime,
    fulfillmentType, deliveryAddress, deliveryDatetime, collectionDatetime,
    deliveryZoneId, deliveryCost, provisionalExpiresAt, notes,
  } = req.body;

  const booking = await prisma.booking.create({
    data: {
      customerId: parseInt(customerId),
      enquiryId: enquiryId ? parseInt(enquiryId) : null,
      status: status || 'PROVISIONAL',
      hireStartDatetime: new Date(hireStartDatetime),
      hireEndDatetime: new Date(hireEndDatetime),
      fulfillmentType,
      deliveryAddress: deliveryAddress || null,
      deliveryDatetime: deliveryDatetime ? new Date(deliveryDatetime) : null,
      collectionDatetime: collectionDatetime ? new Date(collectionDatetime) : null,
      deliveryZoneId: deliveryZoneId ? parseInt(deliveryZoneId) : null,
      deliveryCost: deliveryCost ? parseFloat(deliveryCost) : null,
      provisionalExpiresAt: provisionalExpiresAt ? new Date(provisionalExpiresAt) : null,
      notes: notes || null,
      createdById: req.session.user.id,
    },
  });

  // If this booking is CONFIRMED and came from an enquiry, mark the enquiry CONVERTED
  if (status === 'CONFIRMED' && enquiryId) {
    await prisma.enquiry.update({
      where: { id: parseInt(enquiryId) },
      data: { status: 'CONVERTED' },
    });
  }

  await createAuditLog({
    userId: req.session.user.id,
    action: 'BOOKING_CREATED',
    entityType: 'Booking',
    entityId: booking.id,
    metadata: { status: booking.status },
  });

  res.redirect(`/admin/bookings/${booking.id}`);
}

async function updateStatus(req, res) {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.redirect(`/admin/bookings/${id}`);
  }

  const booking = await prisma.booking.update({ where: { id }, data: { status } });

  // When confirming a booking, mark linked enquiry as CONVERTED
  if (status === 'CONFIRMED' && booking.enquiryId) {
    await prisma.enquiry.update({
      where: { id: booking.enquiryId },
      data: { status: 'CONVERTED' },
    });
  }

  await createAuditLog({
    userId: req.session.user.id,
    action: `BOOKING_STATUS_CHANGED`,
    entityType: 'Booking',
    entityId: id,
    metadata: { status },
  });

  res.redirect(`/admin/bookings/${id}`);
}

async function cancel(req, res) {
  const id = parseInt(req.params.id);

  await prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'BOOKING_CANCELLED',
    entityType: 'Booking',
    entityId: id,
  });

  res.redirect(`/admin/bookings/${id}`);
}

async function calculateDelivery(req, res) {
  const bookingId = parseInt(req.params.id);
  const { venueInput } = req.body;

  try {
    const result = await deliveryService.resolveVenueCoordinates(venueInput, req.session.user.id);

    if (result.status === 'MULTIPLE') {
      return res.json({ status: 'MULTIPLE', options: result.options });
    }

    if (result.status === 'NOT_FOUND') {
      return res.json({ status: 'NOT_FOUND' });
    }

    const zone = await deliveryService.suggestDeliveryZone(result.distanceKm);

    return res.json({
      status: 'OK',
      distanceKm: result.distanceKm,
      suggestedZone: zone,
    });
  } catch (err) {
    console.error('Delivery calculation error:', err);
    return res.status(500).json({ status: 'ERROR', message: 'Delivery calculation failed.' });
  }
}

module.exports = { list, detail, showEdit, update, showCreate, create, updateStatus, cancel, calculateDelivery };



