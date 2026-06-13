'use strict';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Usage:
//   node scripts/test-booking.js 2026-08-15        — create test booking
//   node scripts/test-booking.js --clean           — remove all test data

async function clean() {
  await prisma.bookingItem.deleteMany({ where: { booking: { customer: { email: 'test@example.com' } } } });
  await prisma.booking.deleteMany({ where: { customer: { email: 'test@example.com' } } });
  await prisma.customer.deleteMany({ where: { email: 'test@example.com' } });
  console.log('✓ Test bookings cleaned up');
}

const dateArg = process.argv[2];

if (dateArg === '--clean') {
  clean()
    .catch(err => { console.error(err); process.exit(1); })
    .finally(() => prisma.$disconnect());
  return;
}

if (!dateArg) {
  console.error('Usage: node scripts/test-booking.js YYYY-MM-DD');
  process.exit(1);
}

const testDate     = new Date(dateArg + 'T00:00:00.000Z');
const testDateEnd  = new Date(dateArg + 'T23:59:59.999Z');

async function main() {
  const user = await prisma.user.findFirstOrThrow({ where: { email: 'dev@example.com' } });
  const product = await prisma.product.findFirstOrThrow({ orderBy: { displayOrder: 'asc' } });

  const customer = await prisma.customer.create({
    data: { name: 'Test Customer', email: 'test@example.com' },
  });

  const booking = await prisma.booking.create({
    data: {
      customerId:        customer.id,
      createdById:       user.id,
      status:            'CONFIRMED',
      fulfillmentType:   'STAFF_DELIVERS',
      hireStartDatetime: testDate,
      hireEndDatetime:   testDateEnd,
      items: {
        create: {
          productId: product.id,
          quantity:  product.stockQuantity,
        },
      },
    },
  });

  console.log(`✓ Booking #${booking.id} created`);
  console.log(`  Product : ${product.name}`);
  console.log(`  Date    : ${dateArg}`);
  console.log(`  Status  : CONFIRMED`);
  console.log(`\nTo clean up: node scripts/test-booking.js --clean`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
