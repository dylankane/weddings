'use strict';

const prisma = require('../../lib/prisma');

// Returns availability for each active product across the given date range.
// available = stock_quantity - SUM(booked quantities for overlapping PROVISIONAL/CONFIRMED bookings)
async function checkAvailability({ start, end, productId = null }) {
  const productWhere = { isActive: true };
  if (productId) productWhere.id = productId;

  const products = await prisma.product.findMany({
    where: productWhere,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      bookingItems: {
        include: {
          booking: true,
        },
        where: {
          booking: {
            status: { in: ['PROVISIONAL', 'CONFIRMED'] },
            OR: [
              {
                hireStartDatetime: { lte: end },
                hireEndDatetime: { gte: start },
              },
            ],
          },
        },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  return products.map((product) => {
    const bookedQuantity = product.bookingItems.reduce((sum, item) => sum + item.quantity, 0);
    const availableQuantity = product.stockQuantity - bookedQuantity;
    const hasProvisional = product.bookingItems.some((item) => item.booking.status === 'PROVISIONAL');
    const hasConfirmed = product.bookingItems.some((item) => item.booking.status === 'CONFIRMED');

    let status;
    if (availableQuantity <= 0) {
      status = hasProvisional && !hasConfirmed ? 'PENDING' : 'BOOKED';
    } else if (bookedQuantity > 0) {
      status = 'PARTIAL';
    } else {
      status = 'AVAILABLE';
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      stockQuantity: product.stockQuantity,
      bookedQuantity,
      availableQuantity: Math.max(0, availableQuantity),
      status,
      primaryImage: product.images[0] || null,
    };
  });
}

module.exports = { checkAvailability };

