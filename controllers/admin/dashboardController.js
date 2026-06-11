'use strict';

const prisma = require('../../lib/prisma');

async function show(req, res) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    newEnquiriesCount,
    pendingEnquiriesCount,
    activeBookingsCount,
    provisionalExpiringSoon,
    recentEnquiries,
    recentBookings,
    apiUsageThisMonth,
  ] = await Promise.all([
    prisma.enquiry.count({ where: { status: 'NEW' } }),
    prisma.enquiry.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: { in: ['PROVISIONAL', 'CONFIRMED'] } } }),
    prisma.booking.findMany({
      where: {
        status: 'PROVISIONAL',
        provisionalExpiresAt: {
          gte: now,
          lte: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        },
      },
      include: { customer: true },
      orderBy: { provisionalExpiresAt: 'asc' },
      take: 5,
    }),
    prisma.enquiry.findMany({
      where: { status: { in: ['NEW', 'PENDING'] } },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.booking.findMany({
      where: { status: { in: ['PROVISIONAL', 'CONFIRMED'] } },
      include: { customer: true },
      orderBy: { hireStartDatetime: 'asc' },
      take: 5,
    }),
    prisma.apiUsageLog.count({
      where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
    }),
  ]);

  // Approximate monthly API cost — Geocoding + Distance Matrix = ~$0.015, Places = ~$0.017
  const apiMonthlyCostEstimate = (apiUsageThisMonth * 0.015).toFixed(2);
  const apiMonthlyBudget = parseFloat(process.env.API_MONTHLY_BUDGET_USD || 50);
  const apiUsagePercent = Math.min(100, Math.round((apiMonthlyCostEstimate / apiMonthlyBudget) * 100));
  const apiWarning = apiUsagePercent >= 90;

  res.render('admin/dashboard.njk', {
    title: 'Dashboard',
    newEnquiriesCount,
    pendingEnquiriesCount,
    activeBookingsCount,
    provisionalExpiringSoon,
    recentEnquiries,
    recentBookings,
    apiUsageThisMonth,
    apiMonthlyCostEstimate,
    apiUsagePercent,
    apiWarning,
    section: 'dashboard',
  });
}

module.exports = { show };
