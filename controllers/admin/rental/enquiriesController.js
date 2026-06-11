'use strict';

const prisma = require('../../../lib/prisma');
const { createAuditLog } = require('../../../models/auditLog');

const VALID_STATUSES = ['NEW', 'PENDING', 'CONVERTED', 'ARCHIVED'];
const PAGE_SIZE = 20;

async function list(req, res) {
  const { status, page = 1 } = req.query;
  const skip = (parseInt(page) - 1) * PAGE_SIZE;

  const where = {};
  if (status && VALID_STATUSES.includes(status)) {
    where.status = status;
  } else {
    where.status = { in: ['NEW', 'PENDING'] };
  }

  const [enquiries, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.enquiry.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  res.render('admin/enquiries/list.njk', {
    title: 'Enquiries',
    enquiries,
    total,
    totalPages,
    currentPage: parseInt(page),
    activeStatus: status || 'active',
    section: 'enquiries',
  });
}

async function detail(req, res) {
  const id = parseInt(req.params.id);
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
      bookings: { include: { items: { include: { product: true } } } },
      quotes: { include: { items: true, createdBy: true } },
    },
  });

  if (!enquiry) return res.status(404).render('errors/404.njk', { title: 'Enquiry Not Found' });

  // Auto-transition NEW â†’ PENDING on first open
  if (enquiry.status === 'NEW') {
    await prisma.enquiry.update({ where: { id }, data: { status: 'PENDING' } });
    await createAuditLog({
      userId: req.session.user.id,
      action: 'ENQUIRY_OPENED',
      entityType: 'Enquiry',
      entityId: id,
    });
    enquiry.status = 'PENDING';
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'Enquiry', entityId: id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  res.render('admin/enquiries/detail.njk', {
    title: `Enquiry #${id}`,
    enquiry,
    auditLogs,
    mode: 'detail',
    section: 'enquiries',
  });
}

async function showEdit(req, res) {
  const id = parseInt(req.params.id);
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  if (!enquiry) return res.status(404).render('errors/404.njk', { title: 'Enquiry Not Found' });

  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } });

  res.render('admin/enquiries/edit.njk', {
    title: `Edit Enquiry #${id}`,
    enquiry,
    products,
    mode: 'edit',
    section: 'enquiries',
  });
}

async function update(req, res) {
  const id = parseInt(req.params.id);
  const {
    venueName, venueAddress, venueEircode, venueCounty,
    hireStartDate, hireEndDate, notes,
  } = req.body;

  await prisma.enquiry.update({
    where: { id },
    data: {
      venueName: venueName || null,
      venueAddress: venueAddress || null,
      venueEircode: venueEircode || null,
      venueCounty: venueCounty || null,
      hireStartDate: hireStartDate ? new Date(hireStartDate) : null,
      hireEndDate: hireEndDate ? new Date(hireEndDate) : null,
      notes: notes || null,
    },
  });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'ENQUIRY_UPDATED',
    entityType: 'Enquiry',
    entityId: id,
  });

  res.redirect(`/admin/enquiries/${id}`);
}

async function showCreate(req, res) {
  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } });
  res.render('admin/enquiries/create.njk', {
    title: 'New Enquiry',
    products,
    section: 'enquiries',
    errors: null,
  });
}

async function create(req, res) {
  const {
    customerName, customerEmail, customerPhone,
    venueName, venueAddress, venueEircode, venueCounty,
    hireStartDate, hireEndDate, notes,
  } = req.body;

  const customer = await prisma.customer.create({
    data: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone || null,
    },
  });

  const enquiry = await prisma.enquiry.create({
    data: {
      customerId: customer.id,
      source: 'MANAGER_CREATED',
      status: 'PENDING',
      venueName: venueName || null,
      venueAddress: venueAddress || null,
      venueEircode: venueEircode || null,
      venueCounty: venueCounty || null,
      hireStartDate: hireStartDate ? new Date(hireStartDate) : null,
      hireEndDate: hireEndDate ? new Date(hireEndDate) : null,
      notes: notes || null,
    },
  });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'ENQUIRY_CREATED',
    entityType: 'Enquiry',
    entityId: enquiry.id,
    metadata: { source: 'MANAGER_CREATED' },
  });

  res.redirect(`/admin/enquiries/${enquiry.id}`);
}

async function updateStatus(req, res) {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.redirect(`/admin/enquiries/${id}`);
  }

  await prisma.enquiry.update({ where: { id }, data: { status } });

  await createAuditLog({
    userId: req.session.user.id,
    action: `ENQUIRY_STATUS_CHANGED`,
    entityType: 'Enquiry',
    entityId: id,
    metadata: { status },
  });

  res.redirect(`/admin/enquiries/${id}`);
}

async function archive(req, res) {
  const id = parseInt(req.params.id);

  await prisma.enquiry.update({ where: { id }, data: { status: 'ARCHIVED' } });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'ENQUIRY_ARCHIVED',
    entityType: 'Enquiry',
    entityId: id,
  });

  res.redirect('/admin/enquiries');
}

module.exports = { list, detail, showEdit, update, showCreate, create, updateStatus, archive };

