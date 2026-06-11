'use strict';

const prisma = require('../../../lib/prisma');
const { createAuditLog } = require('../../../models/auditLog');
const emailService = require('../../../services/shared/emailService');
const pdfService = require('../../../services/admin/pdfService');

async function showCreate(req, res) {
  const { enquiryId } = req.query;

  if (!enquiryId) return res.redirect('/admin/enquiries');

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: parseInt(enquiryId) },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  if (!enquiry) return res.status(404).render('errors/404.njk', { title: 'Enquiry Not Found' });

  res.render('admin/quotes/create.njk', {
    title: 'Create Quote',
    enquiry,
    section: 'enquiries',
    errors: null,
  });
}

async function create(req, res) {
  const { enquiryId, expiresAt, notes } = req.body;
  const lineDescriptions = [].concat(req.body['line[description]'] || []);
  const lineQuantities = [].concat(req.body['line[quantity]'] || []);
  const lineUnitPrices = [].concat(req.body['line[unitPrice]'] || []);

  const year = new Date().getFullYear();
  const count = await prisma.quote.count({ where: { reference: { startsWith: `Q-${year}-` } } });
  const reference = `Q-${year}-${String(count + 1).padStart(3, '0')}`;

  const quote = await prisma.quote.create({
    data: {
      enquiryId: parseInt(enquiryId),
      reference,
      expiresAt: new Date(expiresAt),
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
    action: 'QUOTE_CREATED',
    entityType: 'Quote',
    entityId: quote.id,
    metadata: { reference },
  });

  res.redirect(`/admin/quotes/${quote.id}`);
}

async function detail(req, res) {
  const id = parseInt(req.params.id);
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      enquiry: { include: { customer: true } },
      items: true,
      createdBy: true,
    },
  });

  if (!quote) return res.status(404).render('errors/404.njk', { title: 'Quote Not Found' });

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'Quote', entityId: id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  res.render('admin/quotes/detail.njk', {
    title: `Quote ${quote.reference}`,
    quote,
    auditLogs,
    section: 'enquiries',
  });
}

async function send(req, res) {
  const id = parseInt(req.params.id);
  const { sendTo, subject, message } = req.body;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      enquiry: { include: { customer: true } },
      items: true,
      createdBy: true,
    },
  });

  if (!quote) return res.status(404).render('errors/404.njk', { title: 'Quote Not Found' });

  const companySettings = await prisma.companySettings.findFirst();
  const pdfBuffer = await pdfService.generateQuotePdf(quote, quote.items, quote.enquiry.customer, companySettings);

  await emailService.sendQuote({ quote, pdfBuffer, sendTo, subject, message, companySettings });

  await prisma.quote.update({
    where: { id },
    data: { status: 'SENT', sentAt: new Date(), sentTo: sendTo },
  });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'QUOTE_SENT',
    entityType: 'Quote',
    entityId: id,
    metadata: { sentTo: sendTo },
  });

  res.redirect(`/admin/quotes/${id}`);
}

async function updateStatus(req, res) {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

  if (!validStatuses.includes(status)) return res.redirect(`/admin/quotes/${id}`);

  await prisma.quote.update({ where: { id }, data: { status } });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'QUOTE_STATUS_CHANGED',
    entityType: 'Quote',
    entityId: id,
    metadata: { status },
  });

  res.redirect(`/admin/quotes/${id}`);
}

module.exports = { showCreate, create, detail, send, updateStatus };



