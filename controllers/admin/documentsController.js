'use strict';

const fs      = require('fs');
const path    = require('path');
const prisma  = require('../../lib/prisma');
const { generateQuotePdf, generateInvoicePdf } = require('../../services/pdfService');

const JOB_INCLUDE = {
  customer: true,
  delivery: true,
  pricing:  { include: { deliveryZone: true } },
  items: {
    include: {
      product:        true,
      customisations: { include: { customisationOption: true } },
    },
  },
  quote:   true,
  invoice: true,
};

async function getJobAndSettings(id) {
  const [job, settings] = await Promise.all([
    prisma.job.findUnique({ where: { id }, include: JOB_INCLUDE }),
    prisma.companySettings.findFirst(),
  ]);
  return { job, settings };
}

// ─── Quote ────────────────────────────────────────────────────────────────────

async function generateQuote(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });

  try {
    const { job, settings } = await getJobAndSettings(id);
    if (!job) return next({ status: 404, message: 'Job not found' });

    // Upsert the Quote record first so createdAt is available to the template
    const quote = await prisma.quote.upsert({
      where:  { jobId: id },
      create: { jobId: id },
      update: { updatedAt: new Date() },
    });

    // Attach quote to job object so the template can access quote.createdAt
    job.quote = quote;

    const pdfPath = await generateQuotePdf(job, settings);
    const relPath = `/storage/pdfs/quotes/${path.basename(pdfPath)}`;

    await prisma.quote.update({ where: { jobId: id }, data: { pdfUrl: relPath } });

    return res.redirect(`/admin/jobs/${id}`);
  } catch (err) {
    next(err);
  }
}

async function downloadQuote(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });

  try {
    const quote = await prisma.quote.findUnique({ where: { jobId: id } });
    if (!quote || !quote.pdfUrl) return next({ status: 404, message: 'Quote PDF not found' });

    const absPath = path.join(__dirname, '../../storage/pdfs/quotes', `quote-${id}.pdf`);
    if (!fs.existsSync(absPath)) return next({ status: 404, message: 'Quote PDF file missing' });

    return res.download(absPath, `quote-job-${id}.pdf`);
  } catch (err) {
    next(err);
  }
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

async function createInvoice(req, res, next) {
  const id      = parseInt(req.params.id, 10);
  const dueDate = req.body.dueDate || null;
  if (isNaN(id)) return next({ status: 404 });

  try {
    const { job, settings } = await getJobAndSettings(id);
    if (!job) return next({ status: 404, message: 'Job not found' });

    const year    = new Date().getFullYear();
    const tempRef = `INV-${year}-DRAFT-${Date.now()}`;

    const invoice = await prisma.$transaction(async tx => {
      const created = await tx.invoice.create({
        data: {
          jobId:   id,
          reference: tempRef,
          status:  'DRAFT',
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      });
      return tx.invoice.update({
        where: { id: created.id },
        data:  { reference: `INV-${year}-${created.id.toString().padStart(4, '0')}` },
      });
    });

    job.invoice = invoice;

    const pdfPath = await generateInvoicePdf(job, invoice, settings);
    const relPath = `/storage/pdfs/invoices/${path.basename(pdfPath)}`;

    await prisma.invoice.update({ where: { id: invoice.id }, data: { pdfUrl: relPath } });

    return res.redirect(`/admin/jobs/${id}`);
  } catch (err) {
    next(err);
  }
}

async function regenerateInvoice(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });

  try {
    const { job, settings } = await getJobAndSettings(id);
    if (!job || !job.invoice) return next({ status: 404, message: 'Invoice not found' });

    const pdfPath = await generateInvoicePdf(job, job.invoice, settings);
    const relPath = `/storage/pdfs/invoices/${path.basename(pdfPath)}`;

    await prisma.invoice.update({ where: { jobId: id }, data: { pdfUrl: relPath } });

    return res.redirect(`/admin/jobs/${id}`);
  } catch (err) {
    next(err);
  }
}

async function downloadInvoice(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });

  try {
    const invoice = await prisma.invoice.findUnique({ where: { jobId: id } });
    if (!invoice || !invoice.pdfUrl) return next({ status: 404, message: 'Invoice PDF not found' });

    const absPath = path.join(__dirname, '../../storage/pdfs/invoices', `invoice-${id}.pdf`);
    if (!fs.existsSync(absPath)) return next({ status: 404, message: 'Invoice PDF file missing' });

    return res.download(absPath, `${invoice.reference}.pdf`);
  } catch (err) {
    next(err);
  }
}

async function saveInvoiceStatus(req, res, next) {
  const id     = parseInt(req.params.id, 10);
  const VALID  = ['DRAFT', 'SENT', 'PAID', 'OVERDUE'];
  const status = req.body.status;

  if (!VALID.includes(status)) return next({ status: 400, message: 'Invalid invoice status' });

  try {
    await prisma.invoice.update({ where: { jobId: id }, data: { status } });
    return res.redirect(`/admin/jobs/${id}`);
  } catch (err) {
    next(err);
  }
}

// ─── Documents List ───────────────────────────────────────────────────────────

async function list(req, res, next) {
  try {
    const [invoices, quotes, settings] = await Promise.all([
      prisma.invoice.findMany({
        include: { job: { include: { customer: true, pricing: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quote.findMany({
        include: { job: { include: { customer: true, pricing: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companySettings.findFirst(),
    ]);
    res.render('admin/documents/index.njk', {
      currentPage: 'documents',
      invoices,
      quotes,
      settings,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Real-data PDF Previews ───────────────────────────────────────────────────

async function previewJobQuote(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });
  try {
    const { job, settings } = await getJobAndSettings(id);
    if (!job) return next({ status: 404, message: 'Job not found' });
    res.render('pdf/quote.njk', { job, settings });
  } catch (err) {
    next(err);
  }
}

async function previewJobInvoice(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });
  try {
    const { job, settings } = await getJobAndSettings(id);
    if (!job || !job.invoice) return next({ status: 404, message: 'Invoice not found' });
    res.render('pdf/invoice.njk', { job, invoice: job.invoice, settings });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  generateQuote,
  downloadQuote,
  createInvoice,
  regenerateInvoice,
  downloadInvoice,
  saveInvoiceStatus,
  previewJobQuote,
  previewJobInvoice,
};
