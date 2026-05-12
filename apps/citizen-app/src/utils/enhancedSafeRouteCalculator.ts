import { mockIssues, calculateDistance, calculateSafetyScore, Issue } from '../store/issuesStore';

export interface RoutePoint {
  lat: number;
  lng: number;
  safetyScore: number;
}

export interface RouteOption {
  id: string;
  name: string;
  routeType: 'safest' | 'balanced' | 'fastest';
  waypoints: RoutePoint[];
  distance: number; // in km
  estimatedTime: number; // in minutes
  safetyScore: number; // 0-100
  recommendation: string;
  color: string;
  hazards: {
    potholes: number;
    brokenLights: number;
    totalIssues: number;
  };
}

// Generate waypoints between two points
const generateWaypoints = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  numPoints: number = 10
): { lat: number; lng: number }[] => {
  const waypoints: { lat: number; lng: number }[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    waypoints.push({
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    });
  }
  
  return waypoints;
};

// Calculate route avoiding hazards
const calculateRouteWithHazardAvoidance = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  avoidanceLevel: 'high' | 'medium' | 'low'
): RoutePoint[] => {
  const baseWaypoints = generateWaypoints(start, end, 15);
  const avoidanceRadius = avoidanceLevel === 'high' ? 0.5 : avoidanceLevel === 'medium' ? 0.3 : 0.1; // km
  
  const adjustedWaypoints = baseWaypoints.map((point, index) => {
    // Don't adjust start and end points
    if (index === 0 || index === baseWaypoints.length - 1) {
      return {
        ...point,
        safetyScore: calculateSafetyScore(point, 0.5),
      };
    }
    
    // Find nearby hazards
    const nearbyHazards = mockIssues.filter(issue => {
      if (issue.status === 'resolved') return false;
      const distance = calculateDistance(point, { lat: issue.latitude, lng: issue.longitude });
      return distance <= avoidanceRadius;
    });
    
    // If hazards found, try to adjust the waypoint
    if (nearbyHazards.length > 0 && avoidanceLevel !== 'low') {
      // Calculate average hazard position
      const avgHazardLat = nearbyHazards.reduce((sum, h) => sum + h.latitude, 0) / nearbyHazards.length;
      const avgHazardLng = nearbyHazards.reduce((sum, h) => sum + h.longitude, 0) / nearbyHazards.length;
      
      // Move point away from hazards
      const avoidanceFactor = avoidanceLevel === 'high' ? 0.003 : 0.0015;
      const adjustedPoint = {
        lat: point.lat + (point.lat - avgHazardLat) * avoidanceFactor,
        lng: point.lng + (point.lng - avgHazardLng) * avoidanceFactor,
      };
      
      return {
        ...adjustedPoint,
        safetyScore: calculateSafetyScore(adjustedPoint, 0.5),
      };
    }
    
    return {
      ...point,
      safetyScore: calculateSafetyScore(point, 0.5),
    };
  });
  
  return adjustedWaypoints;
};

// Calculate route distance
const calculateRouteDistance = (waypoints: RoutePoint[]): number => {
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += calculateDistance(
      { lat: waypoints[i].lat, lng: waypoints[i].lng },
      { lat: waypoints[i + 1].lat, lng: waypoints[i + 1].lng }
    );
  }
  return totalDistance;
};

// Count hazards along route
const countHazardsAlongRoute = (waypoints: RoutePoint[], radiusKm: number = 0.3) => {
  let potholes = 0;
  let brokenLights = 0;
  const seenIssues = new Set<number>();
  
  waypoints.forEach(point => {
    mockIssues.forEach(issue => {
      if (issue.status === 'resolved' || seenIssues.has(issue.id)) return;
      
      const distance = calculateDistance(
        { lat: point.lat, lng: point.lng },
        { lat: issue.latitude, lng: issue.longitude }
      );
      
      if (distance <= radiusKm) {
        seenIssues.add(issue.id);
        if (issue.type === 'pothole') potholes++;
        if (issue.type === 'streetlight') brokenLights++;
      }
    });
  });
  
  return { potholes, brokenLights, totalIssues: seenIssues.size };
};

// Generate multiple route options
export const generateRouteOptions = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): RouteOption[] => {
  const directDistance = calculateDistance(start, end);
  
  // Safest Route - Maximum hazard avoidance
  const safestWaypoints = calculateRouteWithHazardAvoidance(start, end, 'high');
  const safestDistance = calculateRouteDistance(safestWaypoints);
  const safestSafetyScore = safestWaypoints.reduce((sum, p) => sum + p.safetyScore, 0) / safestWaypoints.length;
  const safestHazards = countHazardsAlongRoute(safestWaypoints);
  
  // Balanced Route - Moderate hazard avoidance
  const balancedWaypoints = calculateRouteWithHazardAvoidance(start, end, 'medium');
  const balancedDistance = calculateRouteDistance(balancedWaypoints);
  const balancedSafetyScore = balancedWaypoints.reduce((sum, p) => sum + p.safetyScore, 0) / balancedWaypoints.length;
  const balancedHazards = countHazardsAlongRoute(balancedWaypoints);
  
  // Fastest Route - Minimal hazard avoidance (direct route)
  const fastestWaypoints = calculateRouteWithHazardAvoidance(start, end, 'low');
  const fastestDistance = calculateRouteDistance(fastestWaypoints);
  const fastestSafetyScore = fastestWaypoints.reduce((sum, p) => sum + p.safetyScore, 0) / fastestWaypoints.length;
  const fastestHazards = countHazardsAlongRoute(fastestWaypoints);
  
  // Calculate estimated times (assuming 30 km/h average speed, adjusted for safety)
  const baseSpeed = 30; // km/h
  
  return [
    {
      id: 'safest',
      name: 'Safest Route',
      routeType: 'safest',
      waypoints: safestWaypoints,
      distance: parseFloat(safestDistance.toFixed(2)),
      estimatedTime: Math.round((safestDistance / baseSpeed) * 60),
      safetyScore: Math.round(safestSafetyScore),
      recommendation: safestSafetyScore >= 80 ? 'Highly Recommended' : safestSafetyScore >= 60 ? 'Recommended' : 'Use with Caution',
      color: '#10b981', // green
      hazards: safestHazards,
    },
    {
      id: 'balanced',
      name: 'Balanced Route',
      routeType: 'balanced',
      waypoints: balancedWaypoints,
      distance: parseFloat(balancedDistance.toFixed(2)),
      estimatedTime: Math.round((balancedDistance / baseSpeed) * 60 * 0.95), // Slightly faster
      safetyScore: Math.round(balancedSafetyScore),
      recommendation: balancedSafetyScore >= 70 ? 'Good Balance' : balancedSafetyScore >= 50 ? 'Moderate Safety' : 'Consider Safer Route',
      color: '#f59e0b', // orange
      hazards: balancedHazards,
    },
    {
      id: 'fastest',
      name: 'Fastest Route',
      routeType: 'fastest',
      waypoints: fastestWaypoints,
      distance: parseFloat(fastestDistance.toFixed(2)),
      estimatedTime: Math.round((fastestDistance / baseSpeed) * 60 * 0.9), // Fastest
      safetyScore: Math.round(fastestSafetyScore),
      recommendation: fastestSafetyScore >= 60 ? 'Quick & Safe' : fastestSafetyScore >= 40 ? 'Proceed with Caution' : 'Not Recommended',
      color: '#3b82f6', // blue
      hazards: fastestHazards,
    },
  ];
};

// Get route summary for Viosa
export const getRouteSummary = (route: RouteOption): string => {
  return `**${route.name}**
📍 Distance: ${route.distance} km
⏱️ Time: ${route.estimatedTime} min
🛡️ Safety: ${route.safetyScore}/100
⚠️ Hazards: ${route.hazards.totalIssues} (${route.hazards.potholes} potholes, ${route.hazards.brokenLights} broken lights)
💡 ${route.recommendation}`;
};
