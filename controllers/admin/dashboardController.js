'use strict';

const prisma = require('../../lib/prisma');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date) {
  return date.toLocaleDateString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function buildCalendarDays(calendarJobs) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayJobs = calendarJobs.filter(job => {
      if (!job.jobStart) return false;
      const d = new Date(job.jobStart);
      return d.toDateString() === date.toDateString();
    });

    days.push({
      dayName:      date.toLocaleDateString('en-IE', { weekday: 'short' }),
      dayNum:       date.getDate(),
      monthName:    date.toLocaleDateString('en-IE', { month: 'short' }),
      isToday:      i === 0,
      isFirstOfMonth: date.getDate() === 1,
      jobs:         dayJobs,
    });
  }

  return days;
}

async function dashboard(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoWeeksAhead = new Date(today);
    twoWeeksAhead.setDate(today.getDate() + 14);

    const [enquiries, confirmedJobs, calendarJobs] = await Promise.all([
      // New enquiries — newest first
      prisma.job.findMany({
        where: { status: 'ENQUIRY' },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          customer: true,
          items: {
            take: 1,
            include: { product: true },
          },
        },
      }),

      // Confirmed upcoming — soonest first
      prisma.job.findMany({
        where: {
          status: 'CONFIRMED',
          jobStart: { gte: today },
        },
        orderBy: { jobStart: 'asc' },
        take: 15,
        include: {
          customer: true,
          delivery: true,
          invoice: true,
        },
      }),

      // All active jobs in next 14 days for calendar
      prisma.job.findMany({
        where: {
          status: { in: ['ENQUIRY', 'CONFIRMED'] },
          jobStart: { gte: today, lt: twoWeeksAhead },
        },
        include: { customer: true },
      }),
    ]);

    return res.render('admin/dashboard.njk', {
      title:        'Dashboard',
      currentPage:  'dashboard',
      greeting:     getGreeting(),
      formattedDate: formatDate(new Date()),
      enquiryCount: enquiries.length,
      enquiries,
      confirmedJobs,
      calendarDays:  buildCalendarDays(calendarJobs),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard };
