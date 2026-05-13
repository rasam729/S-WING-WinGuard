/**
 * WinGuard Safe-First Navigation Engine
 * Road-Following Navigation with OSRM Integration
 * 
 * Safety Formula: S = (w_l * L + w_c * P + w_v * V) / (w_f * C - w_u * U)
 */

// OSRM API endpoint (free public instance)
const OSRM_API = 'https://router.project-osrm.org/route/v1/driving';

// Weights for safety calculation
const WEIGHTS = {
  w_l: 0.35, // Lighting weight
  w_c: 0.25, // Police presence weight
  w_v: 0.20, // Visibility weight
  w_f: 0.15, // Crime factor weight
  w_u: 0.05, // Unresolved issues weight
};

// Road segment base speed (km/h) - realistic for Bengaluru traffic
const BASE_SPEED = 15; // Average speed in Bengaluru considering traffic

// Speed adjustments based on road conditions
const SPEED_FACTORS = {
  highway: 1.5,      // 22.5 km/h on highways
  main_road: 1.2,    // 18 km/h on main roads
  residential: 0.8,  // 12 km/h in residential areas
  congested: 0.5,    // 7.5 km/h in heavy traffic
};

/**
 * Calculate safety score for a road segment
 * @param {Object} segment - Road segment data
 * @param {Array} hazards - Array of hazards (potholes, broken lights)
 * @param {Array} safeHavens - Array of safe havens (police booths, hospitals)
 * @param {number} radius - Search radius in km
 * @returns {number} Safety score (0-100)
 */
export function calculateSegmentSafety(segment, hazards, safeHavens, radius = 0.5) {
  const { lat, lng } = segment;
  
  // Find nearby hazards and safe havens
  const nearbyHazards = hazards.filter(h => 
    calculateDistance({ lat, lng }, { lat: h.latitude, lng: h.longitude }) <= radius
  );
  
  const nearbySafeHavens = safeHavens.filter(s => 
    calculateDistance({ lat, lng }, { lat: s.latitude, lng: s.longitude }) <= radius
  );
  
  // Calculate individual factors
  const L = calculateLightingScore(nearbyHazards);
  const P = calculatePolicePresence(nearbySafeHavens);
  const V = calculateVisibilityScore(nearbyHazards);
  const C = calculateCrimeScore(nearbyHazards);
  const U = calculateUnresolvedIssues(nearbyHazards);
  
  // Apply safety formula
  const numerator = (WEIGHTS.w_l * L) + (WEIGHTS.w_c * P) + (WEIGHTS.w_v * V);
  const denominator = Math.max(0.1, (WEIGHTS.w_f * C) + (WEIGHTS.w_u * U)); // Prevent division by zero
  
  const safetyScore = (numerator / denominator) * 100;
  
  // Normalize to 0-100 range
  return Math.max(0, Math.min(100, safetyScore));
}

/**
 * Calculate lighting score based on functional streetlights
 */
function calculateLightingScore(hazards) {
  const brokenLights = hazards.filter(h => 
    h.type === 'streetlight' && h.status !== 'resolved'
  ).length;
  
  // More broken lights = lower score
  return Math.max(0, 100 - (brokenLights * 15));
}

/**
 * Calculate police presence score
 */
function calculatePolicePresence(safeHavens) {
  const policeBooths = safeHavens.filter(s => s.type === 'police_booth').length;
  
  // More police booths = higher score
  return Math.min(100, policeBooths * 30);
}

/**
 * Calculate visibility score
 */
function calculateVisibilityScore(hazards) {
  const darkZones = hazards.filter(h => 
    h.type === 'streetlight' && h.status === 'critical'
  ).length;
  
  // More dark zones = lower visibility
  return Math.max(0, 100 - (darkZones * 20));
}

/**
 * Calculate crime/incident score
 */
function calculateCrimeScore(hazards) {
  const criticalIssues = hazards.filter(h => h.status === 'critical').length;
  
  // More critical issues = higher crime indicator
  return Math.min(100, criticalIssues * 10);
}

/**
 * Calculate unresolved issues score
 */
function calculateUnresolvedIssues(hazards) {
  const unresolvedPotholes = hazards.filter(h => 
    h.type === 'pothole' && h.status !== 'resolved'
  ).length;
  
  return Math.min(100, unresolvedPotholes * 12);
}

/**
 * Haversine distance calculation
 */
export function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(start, end) {
  const dLon = toRad(end.lng - start.lng);
  const lat1 = toRad(start.lat);
  const lat2 = toRad(end.lat);
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x);
  return (toDeg(bearing) + 360) % 360;
}

function toDeg(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Get direction from bearing
 */
export function getDirection(bearing) {
  const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Fetch road-following route from OSRM
 */
export async function fetchRoadRoute(start, end) {
  try {
    const url = `${OSRM_API}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    
    const route = data.routes[0];
    
    // Convert GeoJSON coordinates to our format
    const coordinates = route.geometry.coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0],
    }));
    
    return {
      coordinates,
      distance: route.distance / 1000, // Convert to km
      duration: route.duration / 60, // Convert to minutes
      steps: route.legs[0].steps.map(step => ({
        instruction: step.maneuver.instruction || getManeuverInstruction(step.maneuver),
        distance: step.distance,
        duration: step.duration,
        location: {
          lat: step.maneuver.location[1],
          lng: step.maneuver.location[0],
        },
        type: step.maneuver.type,
        modifier: step.maneuver.modifier,
      })),
    };
  } catch (error) {
    console.error('OSRM routing error:', error);
    return null;
  }
}

/**
 * Generate instruction from maneuver
 */
function getManeuverInstruction(maneuver) {
  const { type, modifier } = maneuver;
  
  if (type === 'depart') return 'Start your journey';
  if (type === 'arrive') return 'You have arrived at your destination';
  if (type === 'turn') {
    if (modifier === 'left') return 'Turn left';
    if (modifier === 'right') return 'Turn right';
    if (modifier === 'slight left') return 'Turn slightly left';
    if (modifier === 'slight right') return 'Turn slightly right';
    if (modifier === 'sharp left') return 'Make a sharp left turn';
    if (modifier === 'sharp right') return 'Make a sharp right turn';
  }
  if (type === 'continue') return 'Continue straight';
  if (type === 'merge') return `Merge ${modifier || ''}`;
  if (type === 'roundabout') return 'Enter the roundabout';
  if (type === 'rotary') return 'Enter the rotary';
  if (type === 'fork') return `Take the ${modifier} fork`;
  
  return 'Continue';
}

/**
 * Calculate Guardian Path with Road Following
 */
export async function calculateGuardianPathWithRoads(start, end, hazards, safeHavens) {
  // Fetch road-following route from OSRM
  const roadRoute = await fetchRoadRoute(start, end);
  
  if (!roadRoute) {
    // Fallback to direct path if OSRM fails
    return calculateGuardianPath(start, end, hazards, safeHavens, 25);
  }
  
  // Calculate safety scores for each point along the route
  const pathWithSafety = roadRoute.coordinates.map(point => ({
    ...point,
    safetyScore: calculateSegmentSafety(point, hazards, safeHavens, 0.3),
  }));
  
  return {
    path: pathWithSafety,
    distance: roadRoute.distance,
    duration: roadRoute.duration,
    steps: roadRoute.steps,
  };
}

/**
 * A* Pathfinding Algorithm with Safety Weighting
 */
export function calculateGuardianPath(start, end, hazards, safeHavens, gridResolution = 20) {
  // Generate waypoints grid
  const waypoints = generateWaypoints(start, end, gridResolution);
  
  // Calculate safety scores for each waypoint
  const scoredWaypoints = waypoints.map(wp => ({
    ...wp,
    safetyScore: calculateSegmentSafety(wp, hazards, safeHavens, 0.3),
  }));
  
  // A* algorithm
  const openSet = [{ ...start, g: 0, h: heuristic(start, end), f: heuristic(start, end), parent: null }];
  const closedSet = [];
  const path = [];
  
  while (openSet.length > 0) {
    // Get node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    
    // Check if reached destination
    if (calculateDistance(current, end) < 0.1) {
      // Reconstruct path
      let node = current;
      while (node) {
        path.unshift({ lat: node.lat, lng: node.lng, safetyScore: node.safetyScore || 100 });
        node = node.parent;
      }
      path.push({ ...end, safetyScore: calculateSegmentSafety(end, hazards, safeHavens, 0.3) });
      break;
    }
    
    closedSet.push(current);
    
    // Get neighbors
    const neighbors = getNeighbors(current, scoredWaypoints, 0.5);
    
    for (const neighbor of neighbors) {
      if (closedSet.some(n => n.lat === neighbor.lat && n.lng === neighbor.lng)) {
        continue;
      }
      
      // Calculate g score (cost from start)
      const distance = calculateDistance(current, neighbor);
      const safetyFactor = (100 - neighbor.safetyScore) / 100; // Lower safety = higher cost
      const g = current.g + distance * (1 + safetyFactor * 2); // Weight by safety
      
      const existingNode = openSet.find(n => n.lat === neighbor.lat && n.lng === neighbor.lng);
      
      if (!existingNode || g < existingNode.g) {
        const h = heuristic(neighbor, end);
        const f = g + h;
        
        const node = {
          lat: neighbor.lat,
          lng: neighbor.lng,
          safetyScore: neighbor.safetyScore,
          g,
          h,
          f,
          parent: current,
        };
        
        if (existingNode) {
          Object.assign(existingNode, node);
        } else {
          openSet.push(node);
        }
      }
    }
  }
  
  return path.length > 0 ? path : generateDirectPath(start, end, 20);
}

/**
 * Heuristic function (Euclidean distance)
 */
function heuristic(a, b) {
  return calculateDistance(a, b);
}

/**
 * Generate waypoints between start and end
 */
function generateWaypoints(start, end, count) {
  const waypoints = [];
  
  for (let i = 0; i <= count; i++) {
    const ratio = i / count;
    waypoints.push({
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    });
  }
  
  return waypoints;
}

/**
 * Generate direct path (fallback)
 */
function generateDirectPath(start, end, segments) {
  const path = [];
  
  for (let i = 0; i <= segments; i++) {
    const ratio = i / segments;
    path.push({
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
      safetyScore: 50, // Neutral score for direct path
    });
  }
  
  return path;
}

/**
 * Get neighboring waypoints
 */
function getNeighbors(current, waypoints, maxDistance) {
  return waypoints.filter(wp => {
    const dist = calculateDistance(current, wp);
    return dist > 0 && dist <= maxDistance;
  });
}

/**
 * Generate turn-by-turn directions
 */
export function generateTurnByTurnDirections(path) {
  if (path.length < 2) return [];
  
  const directions = [];
  let totalDistance = 0;
  
  // Start instruction
  directions.push({
    instruction: 'Start your journey',
    distance: 0,
    bearing: 0,
    location: path[0],
    type: 'start',
  });
  
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const current = path[i];
    const distance = calculateDistance(prev, current);
    totalDistance += distance;
    
    const bearing = calculateBearing(prev, current);
    const direction = getDirection(bearing);
    
    // Determine turn type
    let turnType = 'straight';
    let instruction = `Continue ${direction.toLowerCase()}`;
    
    if (i > 1) {
      const prevBearing = calculateBearing(path[i - 2], prev);
      const bearingDiff = Math.abs(bearing - prevBearing);
      
      if (bearingDiff > 30 && bearingDiff < 150) {
        turnType = bearingDiff < 90 ? 'slight_turn' : 'turn';
        const turnDirection = (bearing - prevBearing + 360) % 360 > 180 ? 'left' : 'right';
        instruction = `Turn ${turnDirection} towards ${direction.toLowerCase()}`;
      } else if (bearingDiff >= 150) {
        turnType = 'sharp_turn';
        instruction = `Make a sharp turn`;
      }
    }
    
    // Add direction every 0.3km or at turns
    if (distance > 0.3 || turnType !== 'straight' || i === path.length - 1) {
      directions.push({
        instruction,
        distance: totalDistance,
        distanceFromPrev: distance,
        bearing,
        direction,
        location: current,
        type: turnType,
        safetyScore: current.safetyScore,
      });
    }
  }
  
  // End instruction
  directions.push({
    instruction: 'You have arrived at your destination',
    distance: totalDistance,
    bearing: 0,
    location: path[path.length - 1],
    type: 'end',
  });
  
  return directions;
}

/**
 * Calculate route statistics
 */
export function calculateRouteStats(path, hazards) {
  const totalDistance = path.reduce((sum, point, i) => {
    if (i === 0) return 0;
    return sum + calculateDistance(path[i - 1], point);
  }, 0);
  
  const avgSafetyScore = path.reduce((sum, p) => sum + (p.safetyScore || 50), 0) / path.length;
  
  // Calculate estimated time based on realistic Bengaluru traffic conditions
  // Base speed: 15 km/h (realistic for city traffic)
  // Safety factor: Lower safety = slower speed (need to be more careful)
  const safetyFactor = avgSafetyScore / 100;
  const avgSpeed = BASE_SPEED * (0.6 + safetyFactor * 0.4); // 60-100% of base speed (9-15 km/h)
  
  // Add traffic congestion factor (assume moderate traffic)
  const trafficFactor = 0.8; // 20% slower due to traffic
  const effectiveSpeed = avgSpeed * trafficFactor;
  
  // Calculate time in minutes
  const estimatedMinutes = (totalDistance / effectiveSpeed) * 60;
  
  // Add buffer time for stops, turns, and signals (10% of travel time)
  const bufferTime = estimatedMinutes * 0.1;
  const totalTime = Math.round(estimatedMinutes + bufferTime);
  
  // Count hazards along route
  const routeHazards = hazards.filter(h => {
    return path.some(p => calculateDistance(p, { lat: h.latitude, lng: h.longitude }) <= 0.2);
  });
  
  return {
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    estimatedMinutes: totalTime,
    avgSafetyScore: Math.round(avgSafetyScore),
    hazardsNearRoute: routeHazards.length,
    criticalHazards: routeHazards.filter(h => h.status === 'critical').length,
    safetyRating: avgSafetyScore >= 80 ? 'Very Safe' : avgSafetyScore >= 60 ? 'Safe' : avgSafetyScore >= 40 ? 'Moderate' : 'Caution Advised',
  };
}
