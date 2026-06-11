'use strict';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Running seed…');

  // ─── Users ─────────────────────────────────────────────────────────────────

  const devEmail = process.env.SEED_DEV_EMAIL || 'dev@example.com';
  const managerEmail = process.env.SEED_MANAGER_EMAIL || 'manager@example.com';
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'ChangeMe123!';

  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const dev = await prisma.user.upsert({
    where: { email: devEmail },
    update: {},
    create: {
      email: devEmail,
      displayName: 'Developer',
      role: 'SUPER_ADMIN',
      passwordHash,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {},
    create: {
      email: managerEmail,
      displayName: 'Manager',
      role: 'MANAGER',
      passwordHash,
    },
  });

  console.log(`✓ Users: ${dev.email}, ${manager.email}`);

  // ─── Company Settings ──────────────────────────────────────────────────────

  const existing = await prisma.companySettings.findFirst();
  if (!existing) {
    await prisma.companySettings.create({
      data: {
        companyName: 'Wedding Hire Co.',
        tagline: 'Beautiful items for your perfect day',
        contactEmail: managerEmail,
        contactPhone: '+353 1 234 5678',
        contactAddress: 'Dublin, Ireland',
        updatedById: manager.id,
      },
    });
    console.log('✓ Company settings created');
  } else {
    console.log('✓ Company settings already exist — skipped');
  }

  // ─── Email Templates ───────────────────────────────────────────────────────

  const templates = [
    {
      name: 'Enquiry Acknowledgement',
      triggerEvent: 'ENQUIRY_SUBMITTED_CUSTOMER',
      subject: 'We received your enquiry — Wedding Hire Co.',
      description: 'Sent to the customer immediately after they submit an enquiry form.',
    },
    {
      name: 'New Enquiry Notification',
      triggerEvent: 'ENQUIRY_SUBMITTED_MANAGER',
      subject: 'New enquiry received',
      description: 'Sent to the manager when a new enquiry arrives.',
    },
    {
      name: 'Quote',
      triggerEvent: 'QUOTE_SENT',
      subject: 'Your quote from Wedding Hire Co.',
      description: 'Sent to the customer when the manager sends a quote.',
    },
    {
      name: 'Invoice',
      triggerEvent: 'INVOICE_SENT',
      subject: 'Your invoice from Wedding Hire Co.',
      description: 'Sent to the customer when the manager sends an invoice.',
    },
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { triggerEvent: template.triggerEvent },
      update: {},
      create: template,
    });
  }

  console.log('✓ Email templates seeded');

  // ─── Delivery Zones ────────────────────────────────────────────────────────

  const zoneCount = await prisma.deliveryZone.count();
  if (zoneCount === 0) {
    await prisma.deliveryZone.createMany({
      data: [
        {
          name: 'Dublin, Wicklow & Kildare',
          description: 'Free delivery to venues in Dublin, Wicklow and Kildare.',
          zoneType: 'NAMED_REGION',
          price: 0,
          isEnquireOnly: false,
          displayOrder: 1,
        },
        {
          name: 'Rest of Ireland',
          description: 'Delivery across Ireland — contact us for a quote.',
          zoneType: 'NAMED_REGION',
          price: null,
          isEnquireOnly: true,
          displayOrder: 2,
        },
      ],
    });
    console.log('✓ Delivery zones seeded');
  } else {
    console.log('✓ Delivery zones already exist — skipped');
  }

  // ─── Sample Products ───────────────────────────────────────────────────────

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const postBoxLarge = await prisma.product.create({
      data: {
        name: 'Cast Iron Post Box — Large',
        slug: 'cast-iron-post-box-large',
        description: 'A beautiful large cast iron post box, perfect for collecting wedding cards. Adds a timeless, rustic charm to your reception venue.',
        stockQuantity: 1,
        isCustomisable: true,
        customisationOverview: 'The post box can be customised with a personalised card insert. Select from various ribbon colours and monogram options.',
        isActive: true,
        displayOrder: 1,
        customisationOptions: {
          create: [
            {
              name: 'Card Insert Text',
              description: 'Text printed on the insert card (e.g. "Mr & Mrs Smith")',
              type: 'TEXT',
              isRequired: false,
              displayOrder: 1,
            },
            {
              name: 'Ribbon Colour',
              description: 'Colour of the decorative ribbon',
              type: 'SELECT',
              options: ['Ivory', 'Blush Pink', 'Gold', 'Sage Green', 'Navy'],
              isRequired: false,
              displayOrder: 2,
            },
          ],
        },
      },
    });

    const postBoxSmall = await prisma.product.create({
      data: {
        name: 'Cast Iron Post Box — Small',
        slug: 'cast-iron-post-box-small',
        description: 'A charming smaller cast iron post box, ideal for intimate wedding celebrations or as a companion piece alongside the large version.',
        stockQuantity: 1,
        isCustomisable: true,
        customisationOverview: 'Same personalisation options as the large post box.',
        isActive: true,
        displayOrder: 2,
        customisationOptions: {
          create: [
            {
              name: 'Card Insert Text',
              type: 'TEXT',
              isRequired: false,
              displayOrder: 1,
            },
            {
              name: 'Ribbon Colour',
              type: 'SELECT',
              options: ['Ivory', 'Blush Pink', 'Gold', 'Sage Green', 'Navy'],
              isRequired: false,
              displayOrder: 2,
            },
          ],
        },
      },
    });

    console.log(`✓ Sample products created: ${postBoxLarge.name}, ${postBoxSmall.name}`);
  } else {
    console.log('✓ Products already exist — skipped');
  }

  console.log('\nSeed complete.');
  console.log(`\nDefault login credentials:`);
  console.log(`  Dev (SUPER_ADMIN): ${devEmail} / ${defaultPassword}`);
  console.log(`  Manager: ${managerEmail} / ${defaultPassword}`);
  console.log('\n⚠  Change both passwords immediately after first login.\n');
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
