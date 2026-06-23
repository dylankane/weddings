'use strict';

const bcrypt = require('bcrypt');
const prisma  = require('../../lib/prisma');

async function show(req, res) {
  const settings  = await prisma.companySettings.findFirst();
  const social    = (settings && settings.socialLinks) ? settings.socialLinks : {};
  const templates = await prisma.emailTemplate.findMany({ orderBy: { id: 'asc' } });

  // TODO: replace with req.session.userId when auth is built
  const profileUser = await getCurrentUser(req);

  res.render('admin/settings/index', {
    title: 'Settings',
    currentPage: 'settings',
    settings,
    social,
    templates,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

module.exports = { show, saveIdentity, saveContact, saveSeo, saveLocation, saveSignOff, saveTemplate, saveProfile, savePassword };
