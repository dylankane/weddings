'use strict';

const path     = require('path');
const fs       = require('fs');
const nunjucks = require('nunjucks');
const puppeteer = require('puppeteer-core');

const QUOTES_DIR   = path.join(__dirname, '../storage/pdfs/quotes');
const INVOICES_DIR = path.join(__dirname, '../storage/pdfs/invoices');

async function getBrowser() {
  if (process.env.NODE_ENV === 'production') {
    const chromium = require('@sparticuz/chromium');
    return puppeteer.launch({
      args:            chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath:  await chromium.executablePath(),
      headless:        chromium.headless,
    });
  }

  const executablePath =
    process.env.CHROME_PATH ||
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  return puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function renderToPdf(templateName, data) {
  const html    = nunjucks.render(templateName, data);
  const browser = await getBrowser();
  const page    = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const buffer = await page.pdf({
    format:               'A4',
    printBackground:      true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await browser.close();
  return buffer;
}

async function generateQuotePdf(job, settings) {
  const buffer  = await renderToPdf('pdf/quote.njk', { job, settings });
  const outPath = path.join(QUOTES_DIR, `quote-${job.id}.pdf`);
  fs.writeFileSync(outPath, buffer);
  return outPath;
}

async function generateInvoicePdf(job, invoice, settings) {
  const buffer  = await renderToPdf('pdf/invoice.njk', { job, invoice, settings });
  const outPath = path.join(INVOICES_DIR, `invoice-${job.id}.pdf`);
  fs.writeFileSync(outPath, buffer);
  return outPath;
}

module.exports = { generateQuotePdf, generateInvoicePdf };
