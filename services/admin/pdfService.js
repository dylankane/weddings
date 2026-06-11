'use strict';

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const nunjucks = require('nunjucks');
const path = require('path');

const templateEnv = nunjucks.configure(path.join(__dirname, '..', 'views'), { autoescape: true });

function renderHtml(templateName, data) {
  return new Promise((resolve, reject) => {
    templateEnv.render(templateName, data, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function renderToPdf(html) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const buffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return buffer;
}

async function generateQuotePdf(quote, items, customer, companySettings) {
  const html = await renderHtml('admin/documents/quote.njk', {
    quote,
    items,
    customer,
    companySettings,
  });
  return renderToPdf(html);
}

async function generateInvoicePdf(invoice, items, customer, booking, companySettings) {
  const html = await renderHtml('admin/documents/invoice.njk', {
    invoice,
    items,
    customer,
    booking,
    companySettings,
  });
  return renderToPdf(html);
}

module.exports = { generateQuotePdf, generateInvoicePdf };

