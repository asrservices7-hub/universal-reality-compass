import { GeoPosition } from './routingEngine';

export interface GeoZone {
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  name: string;
  type: 'city' | 'district' | 'landmark' | 'sector' | 'unmapped';
  precision: 'street' | 'neighborhood' | 'city' | 'region';
}

// ── Gazetteer Database ──────────────────────────────────────
const EARTH_GAZETTEER: GeoZone[] = [
  {
    bounds: { minLat: 26.80, maxLat: 26.90, minLon: 80.90, maxLon: 81.00 },
    name: 'Anora Kala',
    type: 'district',
    precision: 'neighborhood',
  },
  {
    bounds: { minLat: 26.85, maxLat: 26.86, minLon: 80.92, maxLon: 80.93 },
    name: 'Anora Kala Entrance',
    type: 'landmark',
    precision: 'street',
  },
  {
    bounds: { minLat: 26.75, maxLat: 27.00, minLon: 80.80, maxLon: 81.10 },
    name: 'Lucknow Outer Sector',
    type: 'sector',
    precision: 'city',
  },
  {
    bounds: { minLat: 27.00, maxLat: 27.50, minLon: 81.00, maxLon: 81.50 },
    name: 'Lucknow Periphery',
    type: 'district',
    precision: 'region',
  },
  {
    bounds: { minLat: 26.882, maxLat: 26.884, minLon: 81.017, maxLon: 81.020 },
    name: 'Mercedes Showroom',
    type: 'landmark',
    precision: 'street',
  },
  {
    bounds: { minLat: 26.891, maxLat: 26.894, minLon: 81.059, maxLon: 81.062 },
    name: 'BBD University',
    type: 'landmark',
    precision: 'street',
  },
  {
    bounds: { minLat: 26.873, maxLat: 26.877, minLon: 80.983, maxLon: 80.987 },
    name: 'Tiwariganj',
    type: 'district',
    precision: 'neighborhood',
  },
  {
    bounds: { minLat: 26.883, maxLat: 26.887, minLon: 80.999, maxLon: 81.005 },
    name: 'Kamta Crossing',
    type: 'landmark',
    precision: 'street',
  },
  {
    bounds: { minLat: 28.50, maxLat: 28.70, minLon: 77.10, maxLon: 77.30 },
    name: 'New Delhi Central',
    type: 'city',
    precision: 'city',
  },
];

const MULTIVERSE_GAZETTEER: GeoZone[] = [
  {
    bounds: { minLat: 0, maxLat: 10, minLon: 0, maxLon: 10 },
    name: 'Universe Prime',
    type: 'sector',
    precision: 'region',
  },
];

// ── Spatial Hash Lookup ──────────────────────────────────────
export function resolveNounFromCoords(
  geo: GeoPosition,
  mode: 'earth' | 'multiverse'
): string {
  const gazetteer = mode === 'earth' ? EARTH_GAZETTEER : MULTIVERSE_GAZETTEER;

  // Find all matching zones
  const matches = gazetteer.filter(
    (zone) =>
      geo.latitude >= zone.bounds.minLat &&
      geo.latitude <= zone.bounds.maxLat &&
      geo.longitude >= zone.bounds.minLon &&
      geo.longitude <= zone.bounds.maxLon
  );

  if (matches.length === 0) return 'Unmapped Sector';

  // Return the most precise match (smallest bounding box)
  matches.sort((a, b) => {
    const areaA =
      (a.bounds.maxLat - a.bounds.minLat) *
      (a.bounds.maxLon - a.bounds.minLon);
    const areaB =
      (b.bounds.maxLat - b.bounds.minLat) *
      (b.bounds.maxLon - b.bounds.minLon);
    return areaA - areaB;
  });

  return matches[0].name;
}

// ── Reverse Lookup: Get coordinates from a name ──────────────
export function resolveCoordsFromNoun(
  name: string,
  mode: 'earth' | 'multiverse'
): GeoPosition | null {
  const gazetteer = mode === 'earth' ? EARTH_GAZETTEER : MULTIVERSE_GAZETTEER;

  const zone = gazetteer.find((z) => z.name.toLowerCase() === name.toLowerCase());

  if (!zone) return null;

  // Return center of the zone
  return {
    latitude: (zone.bounds.minLat + zone.bounds.maxLat) / 2,
    longitude: (zone.bounds.minLon + zone.bounds.maxLon) / 2,
    elevation: 0,
    mgrsGrid: '',
    utmZone: 0,
    easting: 0,
    northing: 0,
    precisionMeters: 100, // Zone center is approximate
  };
}

// ── Search: Find nearby named locations ──────────────────────
export function searchNearby(
  geo: GeoPosition,
  radiusKm: number,
  mode: 'earth' | 'multiverse'
): GeoZone[] {
  const gazetteer = mode === 'earth' ? EARTH_GAZETTEER : MULTIVERSE_GAZETTEER;

  // Rough degree-to-km conversion at this latitude
  const latDegPerKm = 1 / 111.32;
  const lonDegPerKm = 1 / (111.32 * Math.cos(geo.latitude * (Math.PI / 180)));

  return gazetteer.filter((zone) => {
    const centerLat = (zone.bounds.minLat + zone.bounds.maxLat) / 2;
    const centerLon = (zone.bounds.minLon + zone.bounds.maxLon) / 2;

    const dLat = Math.abs(centerLat - geo.latitude) / latDegPerKm;
    const dLon = Math.abs(centerLon - geo.longitude) / lonDegPerKm;

    return Math.sqrt(dLat * dLat + dLon * dLon) <= radiusKm;
  });
}
