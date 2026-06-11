'use strict';

const prisma = require('../../../lib/prisma');
const { createAuditLog } = require('../../../models/auditLog');
const storageService = require('../../../services/admin/storageService');

async function show(req, res) {
  const [companySettings, emailTemplates, deliveryZones, users] = await Promise.all([
    prisma.companySettings.findFirst(),
    prisma.emailTemplate.findMany({ orderBy: { id: 'asc' } }),
    prisma.deliveryZone.findMany({ orderBy: [{ isActive: 'desc' }, { displayOrder: 'asc' }] }),
    prisma.user.findMany({ orderBy: { displayName: 'asc' } }),
  ]);

  res.render('admin/settings/index.njk', {
    title: 'Settings',
    companySettings,
    emailTemplates,
    deliveryZones,
    users,
    activeTab: req.query.tab || 'company',
    section: 'settings',
  });
}

async function updateCompany(req, res) {
  const {
    companyName, tagline, contactEmail, contactPhone, contactAddress,
    metaTitle, metaDescription, deliveryInfoText,
    businessLat, businessLng,
    socialFacebook, socialInstagram,
  } = req.body;

  const socialLinks = {
    facebook: socialFacebook || null,
    instagram: socialInstagram || null,
  };

  const existing = await prisma.companySettings.findFirst();

  if (existing) {
    await prisma.companySettings.update({
      where: { id: existing.id },
      data: {
        companyName, tagline: tagline || null,
        contactEmail, contactPhone, contactAddress,
        socialLinks,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        deliveryInfoText: deliveryInfoText || null,
        businessLat: businessLat ? parseFloat(businessLat) : null,
        businessLng: businessLng ? parseFloat(businessLng) : null,
        updatedById: req.session.user.id,
      },
    });
  } else {
    await prisma.companySettings.create({
      data: {
        companyName, tagline: tagline || null,
        contactEmail, contactPhone, contactAddress,
        socialLinks,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        deliveryInfoText: deliveryInfoText || null,
        businessLat: businessLat ? parseFloat(businessLat) : null,
        businessLng: businessLng ? parseFloat(businessLng) : null,
        updatedById: req.session.user.id,
      },
    });
  }

  await createAuditLog({
    userId: req.session.user.id,
    action: 'COMPANY_SETTINGS_UPDATED',
    entityType: 'CompanySettings',
    entityId: 1,
  });

  res.redirect('/admin/settings?tab=company&saved=1');
}

const LOGO_FIELDS = {
  'light-small': 'logoLightSmallUrl',
  'light-large': 'logoLightLargeUrl',
  'dark-small':  'logoDarkSmallUrl',
  'dark-large':  'logoDarkLargeUrl',
};

async function uploadLogo(req, res) {
  if (!req.file) return res.redirect('/admin/settings?tab=company');

  const field = LOGO_FIELDS[req.body.logoVariant];
  if (!field) return res.redirect('/admin/settings?tab=company');

  const url = await storageService.saveFile(req.file);
  const existing = await prisma.companySettings.findFirst();

  if (existing) {
    await prisma.companySettings.update({
      where: { id: existing.id },
      data: { [field]: url, updatedById: req.session.user.id },
    });
  }

  res.redirect('/admin/settings?tab=company&saved=1');
}

async function updateEmailTemplate(req, res) {
  const id = parseInt(req.params.id);
  const { subject, isActive } = req.body;

  await prisma.emailTemplate.update({
    where: { id },
    data: {
      subject,
      isActive: isActive === 'on',
    },
  });

  res.redirect('/admin/settings?tab=email-templates&saved=1');
}

module.exports = { show, updateCompany, uploadLogo, updateEmailTemplate };



