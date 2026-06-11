'use strict';

const nodemailer = require('nodemailer');
const nunjucks = require('nunjucks');
const path = require('path');
const prisma = require('../../lib/prisma');

const transporter = nodemailer.createTransport({
  host: process.env.SES_SMTP_HOST,
  port: parseInt(process.env.SES_SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SES_SMTP_USER,
    pass: process.env.SES_SMTP_PASS,
  },
});

const templateEnv = nunjucks.configure(path.join(__dirname, '..', 'views'), { autoescape: true });

async function renderTemplate(templateName, data) {
  return new Promise((resolve, reject) => {
    templateEnv.render(templateName, data, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function sendMail({ to, subject, html, attachments = [] }) {
  return transporter.sendMail({
    from: `"${process.env.SES_FROM_NAME}" <${process.env.SES_FROM_ADDRESS}>`,
    to,
    subject,
    html,
    attachments,
  });
}

async function sendEnquiryAcknowledgement(enquiry, customer) {
  const [template, companySettings] = await Promise.all([
    prisma.emailTemplate.findFirst({ where: { triggerEvent: 'ENQUIRY_SUBMITTED_CUSTOMER', isActive: true } }),
    prisma.companySettings.findFirst(),
  ]);

  if (!template) return;

  const html = await renderTemplate('emails/enquiry-acknowledgement.njk', {
    customer,
    enquiry,
    companySettings,
  });

  return sendMail({ to: customer.email, subject: template.subject, html });
}

async function sendNewEnquiryNotification(enquiry, customer) {
  const [template, companySettings] = await Promise.all([
    prisma.emailTemplate.findFirst({ where: { triggerEvent: 'ENQUIRY_SUBMITTED_MANAGER', isActive: true } }),
    prisma.companySettings.findFirst(),
  ]);

  if (!template) return;

  const html = await renderTemplate('emails/new-enquiry-notification.njk', {
    customer,
    enquiry,
    companySettings,
    adminUrl: process.env.APP_URL + '/admin/rental/enquiries/' + enquiry.id,
  });

  const managerEmail = process.env.MANAGER_NOTIFICATION_EMAIL || companySettings?.contactEmail;
  if (!managerEmail) return;

  return sendMail({ to: managerEmail, subject: template.subject, html });
}

async function sendQuote({ quote, pdfBuffer, sendTo, subject, message, companySettings }) {
  const html = await renderTemplate('emails/quote-send.njk', {
    quote,
    message,
    companySettings,
  });

  return sendMail({
    to: sendTo,
    subject,
    html,
    attachments: [
      {
        filename: `${quote.reference}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

async function sendInvoice({ invoice, pdfBuffer, sendTo, subject, message, companySettings }) {
  const html = await renderTemplate('emails/invoice-send.njk', {
    invoice,
    message,
    companySettings,
  });

  return sendMail({
    to: sendTo,
    subject,
    html,
    attachments: [
      {
        filename: `${invoice.reference}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

module.exports = {
  sendEnquiryAcknowledgement,
  sendNewEnquiryNotification,
  sendQuote,
  sendInvoice,
  renderTemplate,
  sendMail,
};

