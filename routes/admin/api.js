'use strict';

const express = require('express');
const router  = express.Router();

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
