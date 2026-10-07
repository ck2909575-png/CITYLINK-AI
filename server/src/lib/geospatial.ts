/**
 * Geospatial Utilities for UrbanShield
 * PostGIS math, Haversine spatial calculations, hazard exclusion zones, and detour generation.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates Haversine distance between two coordinates in meters.
 */
export function calculateDistanceMeters(
  point1: LatLng,
  point2: LatLng
): number {
  const lat1Rad = (point1.latitude * Math.PI) / 180;
  const lat2Rad = (point2.latitude * Math.PI) / 180;
  const deltaLatRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLngRad = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Formats distance in meters into human-readable km or m.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Generates GeoJSON polygon coordinates for a hazard exclusion buffer zone.
 */
export function generateHazardPerimeterPolygon(
  center: LatLng,
  radiusMeters: number,
  pointsCount = 32
): [number, number][] {
  const coordinates: [number, number][] = [];
  const latOffset = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lngOffset =
    ((radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI)) /
    Math.cos((center.latitude * Math.PI) / 180);

  for (let i = 0; i < pointsCount; i++) {
    const angle = (i * 2 * Math.PI) / pointsCount;
    const lat = center.latitude + latOffset * Math.sin(angle);
    const lng = center.longitude + lngOffset * Math.cos(angle);
    coordinates.push([lng, lat]);
  }
  // Close the polygon
  coordinates.push(coordinates[0]);
  return coordinates;
}

/**
 * Computes an alternative detour route around a hazard area.
 */
export function calculateDetourWaypoints(
  start: LatLng,
  hazardCenter: LatLng,
  destination: LatLng,
  hazardRadiusMeters: number
): LatLng[] {
  // Safe clearance multiplier
  const clearanceMultiplier = 1.4;
  const safeRadius = hazardRadiusMeters * clearanceMultiplier;

  const latOffset = (safeRadius / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lngOffset =
    ((safeRadius / EARTH_RADIUS_METERS) * (180 / Math.PI)) /
    Math.cos((hazardCenter.latitude * Math.PI) / 180);

  // Northern and Southern detour waypoints
  const northDetour: LatLng = {
    latitude: hazardCenter.latitude + latOffset,
    longitude: hazardCenter.longitude + lngOffset,
  };

  const southDetour: LatLng = {
    latitude: hazardCenter.latitude - latOffset,
    longitude: hazardCenter.longitude - lngOffset,
  };

  const distViaNorth =
    calculateDistanceMeters(start, northDetour) +
    calculateDistanceMeters(northDetour, destination);

  const distViaSouth =
    calculateDistanceMeters(start, southDetour) +
    calculateDistanceMeters(southDetour, destination);

  const selectedDetour = distViaNorth < distViaSouth ? northDetour : southDetour;

  return [start, selectedDetour, destination];
}
