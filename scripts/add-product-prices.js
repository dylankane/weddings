'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rental.products
      ADD COLUMN IF NOT EXISTS price_per_event DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS price_per_day   DECIMAL(10,2)
  `);
  console.log('Columns added: price_per_event, price_per_day');
}

main().catch(console.error).finally(() => prisma.$disconnect());
