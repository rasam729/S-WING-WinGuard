import { Router, Request, Response } from 'express';
import { pool } from '../config/postgres';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token (optional for routes)
const optionalAuth = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
    } catch (error) {
      // Token invalid, continue without auth
    }
  }
  next();
};

// Calculate multiple route options
router.post('/calculate', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { startLat, startLng, endLat, endLng, startAddress, endAddress } = req.body;

    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({
        success: false,
        message: 'Start and end coordinates are required'
      });
    }

    // Get all reports in the area
    const reportsResult = await pool.query(
      `SELECT report_id, category, severity, critical_score, latitude, longitude, status
       FROM reports
       WHERE status != 'Resolved'
       AND ST_DWithin(
         location::geography,
         ST_MakeLine(
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
         ),
         5000
       )`,
      [startLng, startLat, endLng, endLat]
    );

    const reports = reportsResult.rows;

    // Calculate direct distance
    const directDistance = await pool.query(
      `SELECT ST_Distance(
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
       ) / 1000 as distance_km`,
      [startLng, startLat, endLng, endLat]
    );

    const baseDistance = parseFloat(directDistance.rows[0].distance_km);

    // Generate route options
    const routes = [];

    // 1. SAFEST ROUTE - Avoids all high-risk areas
    const safestRoute = generateSafeRoute(
      { lat: startLat, lng: startLng },
      { lat: endLat, lng: endLng },
      reports,
      'safest'
    );
    routes.push({
      routeType: 'safest',
      name: 'Safest Route',
      description: 'Avoids all high-risk areas and critical issues',
      distance: (baseDistance * 1.3).toFixed(2), // 30% longer
      estimatedTime: Math.round(baseDistance * 1.3 * 3), // ~20 km/h
      safetyScore: calculateRouteSafetyScore(safestRoute.points, reports),
      waypoints: safestRoute.points,
      color: '#10b981', // Green
      issues: safestRoute.issues,
      recommendation: 'Recommended for maximum safety'
    });

    // 2. BALANCED ROUTE - Balance between safety and speed
    const balancedRoute = generateSafeRoute(
      { lat: startLat, lng: startLng },
      { lat: endLat, lng: endLng },
      reports,
      'balanced'
    );
    routes.push({
      routeType: 'balanced',
      name: 'Balanced Route',
      description: 'Good balance between safety and travel time',
      distance: (baseDistance * 1.15).toFixed(2), // 15% longer
      estimatedTime: Math.round(baseDistance * 1.15 * 2.8),
      safetyScore: calculateRouteSafetyScore(balancedRoute.points, reports),
      waypoints: balancedRoute.points,
      color: '#3b82f6', // Blue
      issues: balancedRoute.issues,
      recommendation: 'Good for most situations'
    });

    // 3. FASTEST ROUTE - Direct path, minimal detours
    const fastestRoute = generateSafeRoute(
      { lat: startLat, lng: startLng },
      { lat: endLat, lng: endLng },
      reports,
      'fastest'
    );
    routes.push({
      routeType: 'fastest',
      name: 'Fastest Route',
      description: 'Shortest distance, may have some issues',
      distance: baseDistance.toFixed(2),
      estimatedTime: Math.round(baseDistance * 2.5), // ~24 km/h
      safetyScore: calculateRouteSafetyScore(fastestRoute.points, reports),
      waypoints: fastestRoute.points,
      color: '#f59e0b', // Orange
      issues: fastestRoute.issues,
      recommendation: 'Use during daytime or when in a hurry'
    });

    // Sort by safety score (highest first)
    routes.sort((a, b) => b.safetyScore - a.safetyScore);

    res.json({
      success: true,
      data: {
        routes,
        totalReportsInArea: reports.length,
        criticalReports: reports.filter(r => r.critical_score >= 8).length,
        startLocation: { latitude: startLat, longitude: startLng, address: startAddress },
        endLocation: { latitude: endLat, longitude: endLng, address: endAddress }
      }
    });
  } catch (error) {
    console.error('Calculate routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate routes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Save route for user
router.post('/save', optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to save routes'
      });
    }

    const {
      routeName,
      startLat,
      startLng,
      endLat,
      endLng,
      startAddress,
      endAddress,
      routePoints,
      distance,
      estimatedTime,
      safetyScore,
      routeType
    } = req.body;

    const result = await pool.query(
      `INSERT INTO saved_routes (
        user_id, route_name, start_location, end_location,
        start_address, end_address, route_points, distance_km,
        estimated_time_minutes, safety_score, route_type
      )
      VALUES (
        $1, $2, 
        ST_SetSRID(ST_MakePoint($3, $4), 4326),
        ST_SetSRID(ST_MakePoint($5, $6), 4326),
        $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING route_id, route_name, created_at`,
      [
        userId, routeName,
        startLng, startLat,
        endLng, endLat,
        startAddress, endAddress,
        JSON.stringify(routePoints),
        distance, estimatedTime, safetyScore, routeType
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Route saved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Save route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save route'
    });
  }
});

// Get user's saved routes
router.get('/saved', optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const result = await pool.query(
      `SELECT 
        route_id, route_name,
        ST_Y(start_location::geometry) as start_lat,
        ST_X(start_location::geometry) as start_lng,
        ST_Y(end_location::geometry) as end_lat,
        ST_X(end_location::geometry) as end_lng,
        start_address, end_address, route_points,
        distance_km, estimated_time_minutes, safety_score,
        route_type, created_at, is_favorite
       FROM saved_routes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get saved routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved routes'
    });
  }
});

// Helper function to generate route with waypoints
function generateSafeRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  reports: any[],
  routeType: 'safest' | 'balanced' | 'fastest'
): { points: Array<{ lat: number; lng: number }>; issues: any[] } {
  const points: Array<{ lat: number; lng: number }> = [];
  const issues: any[] = [];

  // Number of waypoints based on route type
  const numWaypoints = routeType === 'safest' ? 15 : routeType === 'balanced' ? 10 : 5;

  // Generate waypoints
  for (let i = 0; i <= numWaypoints; i++) {
    const ratio = i / numWaypoints;
    let lat = start.lat + (end.lat - start.lat) * ratio;
    let lng = start.lng + (end.lng - start.lng) * ratio;

    // For safe routes, add detours around high-risk areas
    if (routeType === 'safest' || routeType === 'balanced') {
      const nearbyIssues = reports.filter(r => {
        const distance = Math.sqrt(
          Math.pow(r.latitude - lat, 2) + Math.pow(r.longitude - lng, 2)
        );
        return distance < 0.01; // ~1km
      });

      if (nearbyIssues.length > 0 && nearbyIssues.some(r => r.critical_score >= 7)) {
        // Add detour
        const detourAmount = routeType === 'safest' ? 0.005 : 0.003;
        lat += (Math.random() - 0.5) * detourAmount;
        lng += (Math.random() - 0.5) * detourAmount;
      }
    }

    points.push({ lat, lng });

    // Track issues along route
    const nearbyIssues = reports.filter(r => {
      const distance = Math.sqrt(
        Math.pow(r.latitude - lat, 2) + Math.pow(r.longitude - lng, 2)
      );
      return distance < 0.005; // ~500m
    });

    issues.push(...nearbyIssues);
  }

  return { points, issues };
}

// Helper function to calculate route safety score
function calculateRouteSafetyScore(
  points: Array<{ lat: number; lng: number }>,
  reports: any[]
): number {
  let score = 100;

  points.forEach(point => {
    reports.forEach(report => {
      const distance = Math.sqrt(
        Math.pow(report.latitude - point.lat, 2) +
        Math.pow(report.longitude - point.lng, 2)
      );

      if (distance < 0.005) { // Within ~500m
        const impact = (1 - distance / 0.005) * report.critical_score * 2;
        score -= impact;
      }
    });
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}

export default router;
