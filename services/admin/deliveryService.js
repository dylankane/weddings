'use strict';

const prisma = require('../../lib/prisma');
const mapsService = require('./mapsService');

// Resolves a venue input string to coordinates and road distance from business origin.
// Returns: { status: 'OK'|'MULTIPLE'|'NOT_FOUND', distanceKm, options }
async function resolveVenueCoordinates(input, userId = null) {
  const companySettings = await prisma.companySettings.findFirst();
  if (!companySettings?.businessLat || !companySettings?.businessLng) {
    throw new Error('Business location coordinates are not configured in Settings.');
  }

  const inputType = mapsService.detectInputType(input);
  let coords = null;

  if (inputType === 'eircode' || inputType === 'address') {
    await logApiUsage('GEOCODING', 'MANAGER_TOOL', userId);
    coords = await mapsService.geocodeAddress(input);

    if (!coords) return { status: 'NOT_FOUND' };
  } else {
    await logApiUsage('PLACES_TEXT_SEARCH', 'MANAGER_TOOL', userId);
    const places = await mapsService.searchVenueName(input);

    if (!places.length) return { status: 'NOT_FOUND' };

    if (places.length > 1) {
      return { status: 'MULTIPLE', options: places };
    }

    coords = { lat: places[0].lat, lng: places[0].lng };
  }

  await logApiUsage('DISTANCE_MATRIX', 'MANAGER_TOOL', userId);
  const distance = await mapsService.calculateRoadDistance(
    Number(companySettings.businessLat),
    Number(companySettings.businessLng),
    coords.lat,
    coords.lng,
  );

  if (!distance) return { status: 'NOT_FOUND' };

  return {
    status: 'OK',
    distanceKm: distance.distanceKm,
    coords,
  };
}

// Finds the best matching active delivery zone for a road distance in km.
// Checks zones ordered by displayOrder â€” lowest number matched first.
async function suggestDeliveryZone(distanceKm) {
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true, zoneType: 'RADIUS' },
    orderBy: { displayOrder: 'asc' },
  });

  for (const zone of zones) {
    if (zone.radiusKm && distanceKm <= Number(zone.radiusKm)) {
      return zone;
    }
  }

  // No radius zone matched â€” return the first named region zone as fallback
  const fallback = await prisma.deliveryZone.findFirst({
    where: { isActive: true, zoneType: 'NAMED_REGION' },
    orderBy: { displayOrder: 'asc' },
  });

  return fallback || null;
}

async function logApiUsage(apiName, triggeredBy, userId = null) {
  return prisma.apiUsageLog.create({
    data: { apiName, triggeredBy, userId },
  });
}

module.exports = { resolveVenueCoordinates, suggestDeliveryZone, logApiUsage };

