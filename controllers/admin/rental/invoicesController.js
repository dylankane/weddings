'use strict';

const prisma = require('../../../lib/prisma');
const { createAuditLog } = require('../../../models/auditLog');
const emailService = require('../../../services/shared/emailService');
const pdfService = require('../../../services/admin/pdfService');

async function showCreate(req, res) {
  const { bookingId } = req.query;

  if (!bookingId) return res.redirect('/admin/bookings');

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  if (!booking) return res.status(404).render('errors/404.njk', { title: 'Booking Not Found' });

  res.render('admin/invoices/create.njk', {
    title: 'Create Invoice',
    booking,
    section: 'bookings',
    errors: null,
  });
}

async function create(req, res) {
  const { bookingId, dueDate, notes } = req.body;
  const lineDescriptions = [].concat(req.body['line[description]'] || []);
  const lineQuantities = [].concat(req.body['line[quantity]'] || []);
  const lineUnitPrices = [].concat(req.body['line[unitPrice]'] || []);

  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({ where: { reference: { startsWith: `INV-${year}-` } } });
  const reference = `INV-${year}-${String(count + 1).padStart(3, '0')}`;

  const invoice = await prisma.invoice.create({
    data: {
      bookingId: parseInt(bookingId),
      reference,
      dueDate: new Date(dueDate),
      notes: notes || null,
      createdById: req.session.user.id,
      items: {
        create: lineDescriptions.map((desc, i) => ({
          description: desc,
          quantity: parseInt(lineQuantities[i]),
          unitPrice: parseFloat(lineUnitPrices[i]),
          lineTotal: parseInt(lineQuantities[i]) * parseFloat(lineUnitPrices[i]),
        })),
      },
    },
  });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'INVOICE_CREATED',
    entityType: 'Invoice',
    entityId: invoice.id,
    metadata: { reference },
  });

  res.redirect(`/admin/invoices/${invoice.id}`);
}

async function detail(req, res) {
  const id = parseInt(req.params.id);
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      booking: { include: { customer: true } },
      items: true,
      createdBy: true,
    },
  });

  if (!invoice) return res.status(404).render('errors/404.njk', { title: 'Invoice Not Found' });

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'Invoice', entityId: id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  res.render('admin/invoices/detail.njk', {
    title: `Invoice ${invoice.reference}`,
    invoice,
    auditLogs,
    section: 'bookings',
  });
}

async function send(req, res) {
  const id = parseInt(req.params.id);
  const { sendTo, subject, message } = req.body;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      booking: { include: { customer: true } },
      items: true,
      createdBy: true,
    },
  });

  if (!invoice) return res.status(404).render('errors/404.njk', { title: 'Invoice Not Found' });

  const companySettings = await prisma.companySettings.findFirst();
  const pdfBuffer = await pdfService.generateInvoicePdf(invoice, invoice.items, invoice.booking.customer, invoice.booking);

  await emailService.sendInvoice({ invoice, pdfBuffer, sendTo, subject, message, companySettings });

  await prisma.invoice.update({
    where: { id },
    data: { status: 'SENT', sentAt: new Date(), sentTo: sendTo },
  });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'INVOICE_SENT',
    entityType: 'Invoice',
    entityId: id,
    metadata: { sentTo: sendTo },
  });

  res.redirect(`/admin/invoices/${id}`);
}

async function updateStatus(req, res) {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const validStatuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE'];

  if (!validStatuses.includes(status)) return res.redirect(`/admin/invoices/${id}`);

  await prisma.invoice.update({ where: { id }, data: { status } });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'INVOICE_STATUS_CHANGED',
    entityType: 'Invoice',
    entityId: id,
    metadata: { status },
  });

  res.redirect(`/admin/invoices/${id}`);
}

module.exports = { showCreate, create, detail, send, updateStatus };



