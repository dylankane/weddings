'use strict';

/**
 * Seed script — creates 10 test enquiries for development.
 * Run with: node scripts/seed-enquiries.js
 */

require('dotenv').config();
const prisma = require('../lib/prisma');

async function main() {

  // ─── Product ─────────────────────────────────────────────────────────────────

  const product = await prisma.product.upsert({
    where:  { slug: 'vintage-an-post-postbox' },
    update: {},
    create: {
      name:                  'Vintage An Post Postbox',
      slug:                  'vintage-an-post-postbox',
      description:           'An iconic Irish vintage An Post postbox, lovingly restored. A unique centrepiece for your wedding day.',
      stockQuantity:         3,
      isCustomisable:        true,
      customisationOverview: 'Available with floral arrangements, ribbons, and personalised signage.',
      isActive:              true,
      displayOrder:          1,
    },
  });

  // ─── Seed user (fallback creator until auth is built) ─────────────────────────

  const seedUser = await prisma.user.upsert({
    where:  { email: 'admin@posta.ie' },
    update: {},
    create: {
      email:        'admin@posta.ie',
      passwordHash: 'not-valid-seed-only',
      displayName:  'Posta Admin',
      role:         'MANAGER',
    },
  });

  // ─── Enquiry data ─────────────────────────────────────────────────────────────

  const enquiries = [
    {
      customer: { name: 'Aoife Murphy',    email: 'aoife.murphy@gmail.com',      phone: '+353 87 234 5678' },
      jobStart: new Date('2026-05-16'),
      jobEnd:   new Date('2026-05-17'),
      notes:    'We\'d love the postbox decorated with white roses and eucalyptus to match our floral theme. Ceremony is at 2pm.',
      delivery: { venueName: 'Ballymagarvey Village', venueCounty: 'Meath' },
    },
    {
      customer: { name: 'Siobhán Walsh',   email: 'siobhan.walsh@icloud.com',    phone: '+353 85 678 9012' },
      jobStart: new Date('2026-06-06'),
      jobEnd:   new Date('2026-06-07'),
      notes:    'Reception starts at 4pm. Would like the postbox set up before guests arrive. We have a green and gold colour scheme.',
      delivery: { venueName: 'Clonwilliam House',    venueCounty: 'Tipperary' },
    },
    {
      customer: { name: 'Niamh Brennan',   email: 'niamh.brennan@gmail.com',     phone: '+353 86 345 6789' },
      jobStart: new Date('2026-06-20'),
      jobEnd:   new Date('2026-06-21'),
      notes:    'Outdoor ceremony so ideally the postbox would be sheltered. Can you advise on this?',
      delivery: { venueName: 'The K Club',           venueCounty: 'Kildare' },
    },
    {
      customer: { name: 'Aisling Ryan',    email: 'aisling.ryan@hotmail.com',    phone: '+353 89 456 7890' },
      jobStart: new Date('2026-07-04'),
      jobEnd:   new Date('2026-07-05'),
      notes:    'Interested in having personalised signage on the postbox with our names and wedding date.',
      delivery: { venueName: 'Castle Leslie Estate', venueCounty: 'Monaghan' },
    },
    {
      customer: { name: 'Caoimhe O\'Sullivan', email: 'caoimhe.osullivan@gmail.com', phone: '+353 87 567 8901' },
      jobStart: new Date('2026-07-18'),
      jobEnd:   new Date('2026-07-19'),
      notes:    'We saw your postbox at a friend\'s wedding in Cork last year and absolutely loved it. Would need it for approx 150 guests.',
      delivery: { venueName: 'Fota Island Resort',  venueCounty: 'Cork' },
    },
    {
      customer: { name: 'Róisín Gallagher', email: 'roisin.gallagher@icloud.com', phone: '+353 83 678 9012' },
      jobStart: new Date('2026-08-01'),
      jobEnd:   new Date('2026-08-02'),
      notes:    'Rustic vintage theme. The postbox would be perfect alongside our other vintage props. Can we arrange a viewing?',
      delivery: { venueName: 'Ballynahinch Castle',  venueCounty: 'Galway' },
    },
    {
      customer: { name: 'Eimear Daly',     email: 'eimear.daly@gmail.com',       phone: '+353 85 789 0123' },
      jobStart: new Date('2026-08-15'),
      jobEnd:   new Date('2026-08-16'),
      notes:    'Would like dried floral arrangements in dusty pink and sage green. Very excited about this idea!',
      delivery: { venueName: 'Bellinter House',      venueCounty: 'Meath' },
    },
    {
      customer: { name: 'Sinéad Flynn',    email: 'sinead.flynn@hotmail.com',    phone: '+353 86 890 1234' },
      jobStart: new Date('2026-08-29'),
      jobEnd:   new Date('2026-08-30'),
      notes:    'Beach nearby so may want to use the postbox for an outdoor ceremony backdrop. Need to discuss logistics.',
      delivery: { venueName: 'Markree Castle',       venueCounty: 'Sligo' },
    },
    {
      customer: { name: 'Maeve O\'Leary',  email: 'maeve.oleary@gmail.com',      phone: '+353 87 901 2345' },
      jobStart: new Date('2026-09-05'),
      jobEnd:   new Date('2026-09-06'),
      notes:    'We\'d like the postbox painted a deep navy to match our colour palette if that\'s possible, otherwise original green is fine.',
      delivery: { venueName: 'Lough Erne Resort',    venueCounty: 'Fermanagh' },
    },
    {
      customer: { name: 'Clíodhna Burke',  email: 'cliodhna.burke@icloud.com',   phone: '+353 89 012 3456' },
      jobStart: new Date('2026-09-19'),
      jobEnd:   new Date('2026-09-20'),
      notes:    'Autumn wedding, so autumnal foliage would be lovely on the postbox. Happy to discuss options.',
      delivery: { venueName: 'Killashee Hotel',      venueCounty: 'Kildare' },
    },
  ];

  // ─── Create records ───────────────────────────────────────────────────────────

  for (const e of enquiries) {
    const customer = await prisma.customer.create({ data: e.customer });

    const job = await prisma.job.create({
      data: {
        customerId:  customer.id,
        status:      'ENQUIRY',
        source:      'CUSTOMER_FORM',
        jobStart:    e.jobStart,
        jobEnd:      e.jobEnd,
        notes:       e.notes,
        createdById: seedUser.id,
      },
    });

    await prisma.delivery.create({
      data: {
        jobId:          job.id,
        outboundMethod: 'STAFF',
        returnMethod:   'STAFF',
        venueName:      e.delivery.venueName,
        venueCounty:    e.delivery.venueCounty,
      },
    });

    await prisma.jobItem.create({
      data: {
        jobId:     job.id,
        productId: product.id,
      },
    });

    console.log(`  ✓ Job #${job.id} — ${customer.name} — ${e.delivery.venueName}, ${e.delivery.venueCounty}`);
  }

  console.log(`\nDone. 10 enquiries seeded.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
