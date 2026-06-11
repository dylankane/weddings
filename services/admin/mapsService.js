'use strict';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const DISTANCE_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';
const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

// Eircode format: A65 F4E2 (with or without space) — Irish postal codes
const EIRCODE_REGEX = /^[A-Z][0-9]{2}\s?[A-Z0-9]{4}$/i;
// Structured address heuristic — contains digits and letters with comma or road type keywords
const ADDRESS_REGEX = /\d+.*\b(road|rd|street|st|avenue|ave|lane|ln|drive|dr|close|way|park)\b/i;

function detectInputType(input) {
  const cleaned = input.trim();
  if (EIRCODE_REGEX.test(cleaned)) return 'eircode';
  if (ADDRESS_REGEX.test(cleaned)) return 'address';
  return 'venue_name';
}

async function geocodeAddress(address) {
  const params = new URLSearchParams({ address, key: API_KEY });
  const response = await fetch(`${GEOCODING_URL}?${params}`);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results.length) {
    return null;
  }

  const result = data.results[0];
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}

async function searchVenueName(name) {
  const response = await fetch(PLACES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({
      textQuery: name,
      locationBias: {
        circle: {
          // Bias towards Ireland — centre of country approximately
          center: { latitude: 53.3498, longitude: -6.2603 },
          radius: 400000,
        },
      },
      maxResultCount: 5,
    }),
  });

  const data = await response.json();

  if (!data.places || !data.places.length) return [];

  return data.places.map((place) => ({
    name: place.displayName?.text || name,
    address: place.formattedAddress,
    lat: place.location.latitude,
    lng: place.location.longitude,
  }));
}

async function calculateRoadDistance(originLat, originLng, destLat, destLng) {
  const params = new URLSearchParams({
    origins: `${originLat},${originLng}`,
    destinations: `${destLat},${destLng}`,
    units: 'metric',
    key: API_KEY,
  });

  const response = await fetch(`${DISTANCE_URL}?${params}`);
  const data = await response.json();

  if (data.status !== 'OK') return null;

  const element = data.rows[0]?.elements[0];
  if (!element || element.status !== 'OK') return null;

  return {
    distanceMetres: element.distance.value,
    distanceKm: element.distance.value / 1000,
    durationSeconds: element.duration.value,
  };
}

module.exports = { detectInputType, geocodeAddress, searchVenueName, calculateRoadDistance };
