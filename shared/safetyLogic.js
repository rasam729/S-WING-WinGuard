/**
 * Safety Logic - Core Business Logic for WinGuard Platform
 * Contains algorithms for severity calculation, route weighting, and geographic validation
 */

import {
  ISSUE_TYPE_WEIGHTS,
  TIME_THRESHOLDS,
  DEFAULT_CONFIG,
  VALIDATION
} from './constants.js';

/**
 * Calculate haversine distance between two geographic points
 * @param {Object} p1 - First point {lat, lng}
 * @param {Object} p2 - Second point {lat, lng}
 * @returns {number} Distance in meters
 */
export function haversineDistance(p1, p2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validate if a coordinate is within the operational radius
 * @param {Object} point - Point to validate {lat, lng}
 * @param {Object} center - Center point {lat, lng}
 * @param {number} radius - Operational radius in meters
 * @returns {boolean} True if within radius
 */
export function isWithinOperationalRadius(point, center, radius) {
  // Validate input coordinates
  if (!isValidCoordinate(point) || !isValidCoordinate(center)) {
    return false;
  }

  const distance = haversineDistance(point, center);
  return distance <= radius;
}

/**
 * Validate if coordinates are valid
 * @param {Object} point - Point to validate {lat, lng}
 * @returns {boolean} True if valid
 */
export function isValidCoordinate(point) {
  if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number') {
    return false;
  }

  return (
    point.lat >= VALIDATION.LATITUDE_MIN &&
    point.lat <= VALIDATION.LATITUDE_MAX &&
    point.lng >= VALIDATION.LONGITUDE_MIN &&
    point.lng <= VALIDATION.LONGITUDE_MAX
  );
}

/**
 * Calculate severity score for a safety issue
 * @param {number} userInput - User severity input (1-10)
 * @param {string} issueType - Type of issue
 * @param {Date} timestamp - When the issue was reported
 * @param {Object} location - Issue location {lat, lng}
 * @param {Array} crimeZones - Array of crime zone heatmap points
 * @param {Object} weights - Optional custom weights
 * @returns {number} Calculated severity score (0-100)
 */
export function calculateSeverityScore(
  userInput,
  issueType,
  timestamp,
  location,
  crimeZones = [],
  weights = DEFAULT_CONFIG.SEVERITY_WEIGHTS
) {
  // Validate inputs
  if (
    userInput < VALIDATION.USER_SEVERITY_MIN ||
    userInput > VALIDATION.USER_SEVERITY_MAX
  ) {
    throw new Error(
      `User input must be between ${VALIDATION.USER_SEVERITY_MIN} and ${VALIDATION.USER_SEVERITY_MAX}`
    );
  }

  if (!ISSUE_TYPE_WEIGHTS[issueType]) {
    throw new Error(`Invalid issue type: ${issueType}`);
  }

  // Factor 1: User input (default 40% weight)
  const userFactor = (userInput / 10) * weights.USER_INPUT;

  // Factor 2: Issue type (default 30% weight)
  const typeFactor = ISSUE_TYPE_WEIGHTS[issueType] * weights.ISSUE_TYPE;

  // Factor 3: Time of day (default 20% weight)
  const hour = timestamp.getHours();
  const isNighttime =
    hour >= TIME_THRESHOLDS.NIGHT_START || hour <= TIME_THRESHOLDS.NIGHT_END;
  const timeFactor = isNighttime ? weights.TIME_OF_DAY : weights.TIME_OF_DAY / 2;

  // Factor 4: Proximity to crime zones (default 10% weight)
  let proximityFactor = 0;
  if (crimeZones.length > 0) {
    const nearestCrimeZone = findNearestPoint(location, crimeZones);
    if (nearestCrimeZone) {
      const distanceKm = haversineDistance(location, nearestCrimeZone) / 1000;
      if (distanceKm < 0.5) {
        proximityFactor = weights.CRIME_PROXIMITY;
      } else if (distanceKm < 1.0) {
        proximityFactor = weights.CRIME_PROXIMITY / 2;
      }
    }
  }

  // Sum and scale to 0-100
  const rawScore = userFactor + typeFactor + timeFactor + proximityFactor;
  const score = Math.round(rawScore * 100);

  // Ensure score is within valid range
  return Math.max(
    VALIDATION.CALCULATED_SEVERITY_MIN,
    Math.min(VALIDATION.CALCULATED_SEVERITY_MAX, score)
  );
}

/**
 * Find the nearest point from an array of points
 * @param {Object} target - Target point {lat, lng}
 * @param {Array} points - Array of points with {lat, lng}
 * @returns {Object|null} Nearest point or null if array is empty
 */
export function findNearestPoint(target, points) {
  if (!points || points.length === 0) {
    return null;
  }

  let nearest = points[0];
  let minDistance = haversineDistance(target, nearest);

  for (let i = 1; i < points.length; i++) {
    const distance = haversineDistance(target, points[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = points[i];
    }
  }

  return nearest;
}

/**
 * Calculate route weight for safe routing algorithm
 * @param {Object} node - Current node {lat, lng}
 * @param {Array} infrastructure - Array of infrastructure objects
 * @param {Array} darkSpots - Array of dark spot heatmap points
 * @param {Array} crimeZones - Array of crime zone heatmap points
 * @param {Object} config - Routing configuration
 * @returns {number} Weight multiplier for this node
 */
export function calculateRouteWeight(
  node,
  infrastructure,
  darkSpots,
  crimeZones,
  config = DEFAULT_CONFIG.ROUTING_WEIGHTS
) {
  let weight = 1.0; // Base weight

  // Bonus for proximity to police booths
  const nearestBooth = findNearestInfrastructure(node, infrastructure, 'police_booth');
  if (nearestBooth) {
    const boothDistance = haversineDistance(node, nearestBooth.location);
    if (boothDistance < config.POLICE_BOOTH_RADIUS) {
      weight *= 0.7; // 30% reduction (safer)
    }
  }

  // Bonus for proximity to streetlights
  const nearestLight = findNearestInfrastructure(node, infrastructure, 'streetlight');
  if (nearestLight && nearestLight.status === 'functional') {
    const lightDistance = haversineDistance(node, nearestLight.location);
    if (lightDistance < config.STREETLIGHT_RADIUS) {
      weight *= 0.85; // 15% reduction (safer)
    }
  }

  // Penalty for dark spots
  if (isInHeatmapZone(node, darkSpots)) {
    weight *= config.DARK_SPOT_PENALTY; // 2x penalty
  }

  // Penalty for crime zones
  if (isInHeatmapZone(node, crimeZones)) {
    weight *= config.CRIME_ZONE_PENALTY; // 3x penalty
  }

  return weight;
}

/**
 * Find nearest infrastructure of a specific type
 * @param {Object} point - Target point {lat, lng}
 * @param {Array} infrastructure - Array of infrastructure objects
 * @param {string} type - Infrastructure type to filter
 * @returns {Object|null} Nearest infrastructure or null
 */
export function findNearestInfrastructure(point, infrastructure, type) {
  const filtered = infrastructure.filter((item) => item.type === type);
  if (filtered.length === 0) {
    return null;
  }

  let nearest = filtered[0];
  let minDistance = haversineDistance(point, nearest.location);

  for (let i = 1; i < filtered.length; i++) {
    const distance = haversineDistance(point, filtered[i].location);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = filtered[i];
    }
  }

  return nearest;
}

/**
 * Check if a point is within a heatmap zone
 * @param {Object} point - Point to check {lat, lng}
 * @param {Array} heatmapPoints - Array of heatmap points with intensity
 * @param {number} threshold - Intensity threshold (default 0.5)
 * @returns {boolean} True if in zone
 */
export function isInHeatmapZone(point, heatmapPoints, threshold = 0.5) {
  if (!heatmapPoints || heatmapPoints.length === 0) {
    return false;
  }

  // Check if any nearby heatmap point has intensity above threshold
  for (const heatPoint of heatmapPoints) {
    const distance = haversineDistance(point, heatPoint);
    if (distance < 100 && heatPoint.intensity >= threshold) {
      // Within 100m and high intensity
      return true;
    }
  }

  return false;
}

/**
 * Calculate bounding box for a center point and radius
 * @param {Object} center - Center point {lat, lng}
 * @param {number} radius - Radius in meters
 * @returns {Object} Bounding box {north, south, east, west}
 */
export function calculateBoundingBox(center, radius) {
  const latDelta = (radius / 111320); // 1 degree latitude ≈ 111.32 km
  const lngDelta = radius / (111320 * Math.cos((center.lat * Math.PI) / 180));

  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta
  };
}

/**
 * Normalize severity score to a category
 * @param {number} score - Severity score (0-100)
 * @returns {string} Category: 'low', 'medium', or 'high'
 */
export function getSeverityCategory(score) {
  if (score <= 39) return 'low';
  if (score <= 79) return 'medium';
  return 'high';
}

/**
 * Get color for severity score
 * @param {number} score - Severity score (0-100)
 * @returns {string} Hex color code
 */
export function getSeverityColor(score) {
  if (score <= 39) return '#22c55e'; // green
  if (score <= 79) return '#eab308'; // yellow
  return '#ef4444'; // red
}

export default {
  haversineDistance,
  isWithinOperationalRadius,
  isValidCoordinate,
  calculateSeverityScore,
  findNearestPoint,
  calculateRouteWeight,
  findNearestInfrastructure,
  isInHeatmapZone,
  calculateBoundingBox,
  getSeverityCategory,
  getSeverityColor
};
