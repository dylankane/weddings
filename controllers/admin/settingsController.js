'use strict';

const bcrypt = require('bcrypt');
const prisma  = require('../../lib/prisma');

async function show(req, res) {
  const settings  = await prisma.companySettings.findFirst();
  const social    = (settings && settings.socialLinks) ? settings.socialLinks : {};
  const templates = await prisma.emailTemplate.findMany({ orderBy: { id: 'asc' } });
  const zones     = await prisma.deliveryZone.findMany({ orderBy: { minKm: 'asc' } });

  // TODO: replace with req.session.userId when auth is built
  const profileUser = await getCurrentUser(req);

  res.render('admin/settings/index', {
    title: 'Settings',
    currentPage: 'settings',
    settings,
    social,
    templates,
    zones,
    profileUser,
    profileNotice: req.query.notice || null,
  });
}

async function saveIdentity(req, res) {
  const {
    companyName,
    tagline,
    logoLightSmallUrl,
    logoLightLargeUrl,
    logoDarkSmallUrl,
    logoDarkLargeUrl,
  } = req.body;

  const data = {
    companyName,
    tagline:           tagline           || null,
    logoLightSmallUrl: logoLightSmallUrl || null,
    logoLightLargeUrl: logoLightLargeUrl || null,
    logoDarkSmallUrl:  logoDarkSmallUrl  || null,
    logoDarkLargeUrl:  logoDarkLargeUrl  || null,
  };

  await upsert(data);
  res.redirect('/admin/settings');
}

async function saveContact(req, res) {
  const { contactEmail, contactPhone, contactAddress } = req.body;

  await upsert({ contactEmail, contactPhone, contactAddress });
  res.redirect('/admin/settings');
}

async function saveSeo(req, res) {
  const {
    metaTitle,
    metaDescription,
    socialInstagram,
    socialFacebook,
    socialTiktok,
    socialPinterest,
  } = req.body;

  const socialLinks = {};
  if (socialInstagram) socialLinks.instagram = socialInstagram;
  if (socialFacebook)  socialLinks.facebook  = socialFacebook;
  if (socialTiktok)    socialLinks.tiktok    = socialTiktok;
  if (socialPinterest) socialLinks.pinterest = socialPinterest;

  await upsert({
    metaTitle:       metaTitle       || null,
    metaDescription: metaDescription || null,
    socialLinks:     Object.keys(socialLinks).length ? socialLinks : null,
  });

  res.redirect('/admin/settings');
}

async function saveLocation(req, res) {
  const { businessLat, businessLng, deliveryInfoText } = req.body;

  await upsert({
    businessLat:      businessLat      ? parseFloat(businessLat)      : null,
    businessLng:      businessLng      ? parseFloat(businessLng)      : null,
    deliveryInfoText: deliveryInfoText || null,
  });

  res.redirect('/admin/settings');
}

async function saveSignOff(req, res) {
  const { emailSignOff } = req.body;
  await upsert({ emailSignOff: emailSignOff || null });
  res.redirect('/admin/settings?tab=email-templates');
}

async function savePdfSettings(req, res) {
  const { paymentInstructions, bankDetails, invoiceNotes } = req.body;
  await upsert({
    paymentInstructions: paymentInstructions || null,
    bankDetails:         bankDetails         || null,
    invoiceNotes:        invoiceNotes        || null,
  });
  res.redirect('/admin/documents?tab=settings');
}

async function saveQuoteSettings(req, res) {
  const { quoteNotes } = req.body;
  await upsert({ quoteNotes: quoteNotes || null });
  res.redirect('/admin/documents?tab=settings');
}

// ─── PDF Previews ─────────────────────────────────────────────────────────────

const MOCK_JOB = {
  id: 42,
  notes: 'Please ensure white gloves are worn during setup. Access to the venue from 10am.',
  jobStart: new Date('2026-09-12'),
  jobEnd:   new Date('2026-09-14'),
  customer: {
    name:  'Sarah & James Murphy',
    email: 'sarah.murphy@email.com',
    phone: '+353 87 123 4567',
  },
  delivery: {
    venueName:   'Ballymagarvey Village',
    venueCounty: 'Meath',
  },
  pricing: {
    rentalCost:   450.00,
    deliveryCost:  75.00,
    totalCost:    525.00,
  },
  items: [
    {
      quantity:   2,
      unitPrice:  150.00,
      product: { name: 'Cast Iron Post Box', pricePerEvent: 150.00 },
      customisations: [
        { price: 25.00, value: 'Murphy', customisationOption: { name: 'Custom name plate' } },
      ],
    },
    {
      quantity:  3,
      unitPrice: 50.00,
      product: { name: 'Decorative Lantern', pricePerEvent: 50.00 },
      customisations: [],
    },
  ],
  quote: { createdAt: new Date(), updatedAt: new Date() },
};

const MOCK_INVOICE = {
  reference: 'INV-2026-0042',
  createdAt: new Date(),
  dueDate:   new Date('2026-08-01'),
  status:    'DRAFT',
};

async function previewQuote(req, res) {
  const settings = await prisma.companySettings.findFirst();
  res.render('pdf/quote.njk', { job: MOCK_JOB, settings });
}

async function previewInvoice(req, res) {
  const settings = await prisma.companySettings.findFirst();
  res.render('pdf/invoice.njk', { job: MOCK_JOB, invoice: MOCK_INVOICE, settings });
}

async function saveTemplate(req, res) {
  const id = parseInt(req.params.id, 10);
  const { subject, body, isActive } = req.body;

  await prisma.emailTemplate.update({
    where: { id },
    data: {
      subject,
      body:     body     || null,
      isActive: isActive === 'on',
    },
  });

  res.redirect('/admin/settings?tab=email-templates');
}

async function saveProfile(req, res) {
  const { displayName, email } = req.body;

  const user = await getCurrentUser(req);
  if (!user) return res.redirect('/admin/settings?tab=profile');

  await prisma.user.update({
    where: { id: user.id },
    data:  { displayName, email },
  });

  res.redirect('/admin/settings?tab=profile&notice=profile-saved');
}

async function savePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const user = await getCurrentUser(req);
  if (!user) return res.redirect('/admin/settings?tab=profile');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return res.redirect('/admin/settings?tab=profile&notice=invalid-password');
  }

  if (newPassword !== confirmPassword) {
    return res.redirect('/admin/settings?tab=profile&notice=password-mismatch');
  }

  if (newPassword.length < 8) {
    return res.redirect('/admin/settings?tab=profile&notice=password-too-short');
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });

  res.redirect('/admin/settings?tab=profile&notice=password-saved');
}

async function saveZone(req, res) {
  const id = req.params.id ? parseInt(req.params.id, 10) : null;
  const { name, description, minKm, maxKm, price } = req.body;

  const data = {
    name,
    description: description || null,
    minKm:    minKm  !== '' && minKm  != null ? parseFloat(minKm)  : 0,
    maxKm:    maxKm  !== '' && maxKm  != null ? parseFloat(maxKm)  : null,
    price:    price  !== '' && price  != null ? parseFloat(price)  : null,
  };

  if (id) {
    await prisma.deliveryZone.update({ where: { id }, data });
  } else {
    await prisma.deliveryZone.create({ data });
  }

  await reRankZones();
  res.redirect('/admin/settings?tab=delivery-zones');
}

async function deleteZone(req, res) {
  const id = parseInt(req.params.id, 10);
  await prisma.deliveryZone.delete({ where: { id } });
  await reRankZones();
  res.redirect('/admin/settings?tab=delivery-zones');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function reRankZones() {
  const zones = await prisma.deliveryZone.findMany({ orderBy: { minKm: 'asc' } });
  await Promise.all(
    zones.map((z, i) =>
      prisma.deliveryZone.update({ where: { id: z.id }, data: { displayOrder: i + 1 } })
    )
  );
}

// TODO: replace with session lookup when auth is built
async function getCurrentUser(req) {
  if (req.session && req.session.userId) {
    return prisma.user.findUnique({ where: { id: req.session.userId } });
  }
  return prisma.user.findFirst({
    where:   { role: { in: ['SUPER_ADMIN', 'MANAGER'] }, isActive: true },
    orderBy: { id: 'asc' },
  });
}

async function upsert(data) {
  const existing = await prisma.companySettings.findFirst();
  if (existing) {
    return prisma.companySettings.update({ where: { id: existing.id }, data });
  }
  // Seed required string fields with empty strings if not provided on first save
  return prisma.companySettings.create({
    data: {
      companyName:    '',
      contactEmail:   '',
      contactPhone:   '',
      contactAddress: '',
      ...data,
    },
  });
}

module.exports = { show, saveIdentity, saveContact, saveSeo, saveLocation, saveSignOff, savePdfSettings, saveQuoteSettings, saveTemplate, saveProfile, savePassword, saveZone, deleteZone, previewQuote, previewInvoice };
