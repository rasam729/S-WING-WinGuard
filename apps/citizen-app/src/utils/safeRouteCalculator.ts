// Safe Route Calculator with A* algorithm
// Considers safety factors: potholes, streetlights, crime reports

interface Point {
  lat: number;
  lng: number;
}

interface Report {
  latitude: number;
  longitude: number;
  category: string;
  severity: number;
  status: string;
}

interface RouteSegment {
  lat: number;
  lng: number;
  safetyScore: number;
}

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (p1: Point, p2: Point): number => {
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
};

// Calculate safety score for a point based on nearby reports
export const calculateSafetyScore = (point: Point, reports: Report[]): number => {
  let score = 100; // Start with perfect score

  reports.forEach(report => {
    if (report.status === 'Resolved') return; // Skip resolved issues

    const distance = calculateDistance(point, {
      lat: report.latitude,
      lng: report.longitude
    });

    // Issues within 500m affect safety score
    if (distance < 500) {
      const impact = (1 - distance / 500) * report.severity * 2;
      
      // Different categories have different impacts
      const categoryMultiplier: { [key: string]: number } = {
        'Crime': 3.0,
        'Dark Alley': 2.5,
        'Streetlight': 2.0,
        'Pothole': 1.5,
        'Other': 1.0
      };

      const multiplier = categoryMultiplier[report.category] || 1.0;
      score -= impact * multiplier;
    }
  });

  return Math.max(0, Math.min(100, score));
};

// Generate intermediate points between start and end
const generateWaypoints = (start: Point, end: Point, numPoints: number = 10): Point[] => {
  const points: Point[] = [start];
  
  for (let i = 1; i < numPoints; i++) {
    const ratio = i / numPoints;
    points.push({
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio
    });
  }
  
  points.push(end);
  return points;
};

// Calculate safe route using simplified A* algorithm
export const calculateSafeRoute = (
  start: Point,
  end: Point,
  reports: Report[],
  preferSafety: boolean = true
): RouteSegment[] => {
  // Generate waypoints along the direct route
  const directRoute = generateWaypoints(start, end, 20);
  
  if (!preferSafety) {
    // Fastest route - just return direct path
    return directRoute.map(point => ({
      lat: point.lat,
      lng: point.lng,
      safetyScore: calculateSafetyScore(point, reports)
    }));
  }

  // Safe route - try to avoid dangerous areas
  const safeRoute: RouteSegment[] = [{ ...start, safetyScore: 100 }];
  
  for (let i = 1; i < directRoute.length; i++) {
    const currentPoint = directRoute[i];
    const safetyScore = calculateSafetyScore(currentPoint, reports);
    
    // If safety score is too low, try to find alternative point
    if (safetyScore < 50 && i < directRoute.length - 1) {
      // Try points slightly offset from direct route
      const alternatives = [
        { lat: currentPoint.lat + 0.001, lng: currentPoint.lng },
        { lat: currentPoint.lat - 0.001, lng: currentPoint.lng },
        { lat: currentPoint.lat, lng: currentPoint.lng + 0.001 },
        { lat: currentPoint.lat, lng: currentPoint.lng - 0.001 },
      ];
      
      let bestAlternative = currentPoint;
      let bestScore = safetyScore;
      
      alternatives.forEach(alt => {
        const altScore = calculateSafetyScore(alt, reports);
        if (altScore > bestScore) {
          bestAlternative = alt;
          bestScore = altScore;
        }
      });
      
      safeRoute.push({
        lat: bestAlternative.lat,
        lng: bestAlternative.lng,
        safetyScore: bestScore
      });
    } else {
      safeRoute.push({
        lat: currentPoint.lat,
        lng: currentPoint.lng,
        safetyScore
      });
    }
  }
  
  return safeRoute;
};

// Calculate route statistics
export const calculateRouteStats = (route: RouteSegment[]) => {
  const totalDistance = route.reduce((sum, point, i) => {
    if (i === 0) return 0;
    return sum + calculateDistance(
      { lat: route[i - 1].lat, lng: route[i - 1].lng },
      { lat: point.lat, lng: point.lng }
    );
  }, 0);

  const avgSafetyScore = route.reduce((sum, point) => sum + point.safetyScore, 0) / route.length;
  const minSafetyScore = Math.min(...route.map(p => p.safetyScore));
  
  const estimatedTime = (totalDistance / 1000) * 3; // Assume 20 km/h average speed in city
  
  return {
    distance: totalDistance,
    distanceKm: (totalDistance / 1000).toFixed(2),
    avgSafetyScore: Math.round(avgSafetyScore),
    minSafetyScore: Math.round(minSafetyScore),
    estimatedMinutes: Math.round(estimatedTime),
    safetyRating: avgSafetyScore >= 80 ? 'Very Safe' : avgSafetyScore >= 60 ? 'Safe' : avgSafetyScore >= 40 ? 'Moderate' : 'Caution Advised'
  };
};

// Generate turn-by-turn instructions
export const generateInstructions = (route: RouteSegment[]): string[] => {
  const instructions: string[] = [];
  
  instructions.push('🚀 Start your journey');
  
  // Analyze route segments for safety warnings
  route.forEach((point, i) => {
    if (i === 0 || i === route.length - 1) return;
    
    if (point.safetyScore < 50) {
      instructions.push(`⚠️ Caution: Lower safety area ahead (Score: ${Math.round(point.safetyScore)}/100)`);
    }
    
    // Add distance markers
    if (i % 5 === 0) {
      const distanceFromStart = route.slice(0, i + 1).reduce((sum, p, idx) => {
        if (idx === 0) return 0;
        return sum + calculateDistance(
          { lat: route[idx - 1].lat, lng: route[idx - 1].lng },
          { lat: p.lat, lng: p.lng }
        );
      }, 0);
      instructions.push(`📍 Continue for ${(distanceFromStart / 1000).toFixed(1)} km`);
    }
  });
  
  instructions.push('🎯 You have arrived at your destination');
  
  return instructions;
};

// Generate heatmap data for safety visualization
export const generateSafetyHeatmap = (
  center: Point,
  radius: number,
  reports: Report[],
  gridSize: number = 20
): Array<{ lat: number; lng: number; intensity: number }> => {
  const heatmapData: Array<{ lat: number; lng: number; intensity: number }> = [];
  
  // Convert radius from meters to degrees (approximate)
  const radiusDeg = radius / 111000; // 1 degree ≈ 111km
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = center.lat + (i - gridSize / 2) * (radiusDeg / gridSize) * 2;
      const lng = center.lng + (j - gridSize / 2) * (radiusDeg / gridSize) * 2;
      
      const safetyScore = calculateSafetyScore({ lat, lng }, reports);
      
      // Convert safety score to heat intensity (0-1)
      // Lower safety = higher heat
      const intensity = (100 - safetyScore) / 100;
      
      heatmapData.push({ lat, lng, intensity });
    }
  }
  
  return heatmapData;
};
