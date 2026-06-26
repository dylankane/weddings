'use strict';

const express = require('express');
const router  = express.Router();
const prisma  = require('../../lib/prisma');

// ─── Job Search ───────────────────────────────────────────────────────────────

const MONTH_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

router.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ results: [] });

    const monthNum = MONTH_MAP[q.toLowerCase()] ?? null;
    const jobId    = /^\d+$/.test(q) ? parseInt(q, 10) : null;

    if (monthNum) {
      const allJobs = await prisma.job.findMany({
        where:   { jobStart: { not: null } },
        include: {
          customer: { select: { name: true } },
          invoice:  { select: { reference: true } },
        },
        orderBy: [{ jobStart: 'asc' }],
      });

      const jobs = allJobs
        .filter(j => new Date(j.jobStart).getUTCMonth() + 1 === monthNum)
        .slice(0, 8);

      return res.json({
        results: jobs.map(j => ({
          id:           j.id,
          customerName: j.customer?.name   ?? null,
          status:       j.status,
          jobStart:     j.jobStart,
          reference:    j.invoice?.reference ?? null,
          url:          `/admin/jobs/${j.id}`,
        })),
      });
    }

    const orClauses = [
      { customer: { name:      { contains: q, mode: 'insensitive' } } },
      { invoice:  { reference: { contains: q, mode: 'insensitive' } } },
    ];
    if (jobId) orClauses.push({ id: jobId });

    const jobs = await prisma.job.findMany({
      where: { OR: orClauses },
      include: {
        customer: { select: { name: true } },
        invoice:  { select: { reference: true } },
      },
      take: 8,
      orderBy: [{ jobStart: { sort: 'asc', nulls: 'last' } }],
    });

    res.json({
      results: jobs.map(j => ({
        id:           j.id,
        customerName: j.customer?.name  ?? null,
        status:       j.status,
        jobStart:     j.jobStart,
        reference:    j.invoice?.reference ?? null,
        url:          `/admin/jobs/${j.id}`,
      })),
    });
  } catch (err) {
    console.error('[search]', err);
    res.status(500).json({ results: [] });
  }
});

// ─── Venue Search ─────────────────────────────────────────────────────────────
// Mock responses — replace body with Google Places Text Search when key is ready

router.post('/api/venue-search', (req, res) => {
  const { venueName, venueCounty, venueAddress, venueEircode } = req.body;

  const mock = [
    {
      name:    'Luttrellstown Castle Resort',
      address: 'Clonsilla, Dublin 15, D15 W9X8',
      county:  'Dublin',
      eircode: 'D15W9X8',
      lat:     53.3804,
      lng:     -6.4248
    },
    {
      name:    'Ballymagarvey Village',
      address: 'Ballymagarvey, Balrath, Navan, Co. Meath',
      county:  'Meath',
      eircode: 'C15XH02',
      lat:     53.6333,
      lng:     -6.5167
    }
  ];

  res.json({ results: mock });
});

// ─── Distance & Tier Lookup ───────────────────────────────────────────────────
// Mock responses — replace with Distance Matrix API + Prisma zone query when key is ready

router.post('/api/venue-distance', (req, res) => {
  res.json({
    distanceKm:  42.3,
    durationMins: 48,
    zone: {
      id:    1,
      name:  'Zone 2 (30–60km)',
      price: 75.00
    }
  });
});

module.exports = router;
