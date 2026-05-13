/**
 * Safety Score Routes
 * API endpoints for safety score calculations and analytics
 */

import { Router, Request, Response } from 'express';
import {
  calculateSafetyScore,
  simulateInfrastructureImpact,
  getAllAreaScores,
  BENGALURU_CRIME_DATA,
  BENGALURU_AREA_COORDS
} from '../services/safetyScoreService';

const router = Router();

/**
 * GET /api/safety-score/calculate
 * Calculate safety score for a specific location
 * Query params: lat, lng, radius (optional, default 1000m)
 */
router.get('/safety-score/calculate', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: lat and lng'
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const searchRadius = radius ? parseInt(radius as string) : 1000;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates'
      });
    }

    const score = await calculateSafetyScore(latitude, longitude, searchRadius);

    res.json({
      success: true,
      data: {
        location: { latitude, longitude },
        radius: searchRadius,
        ...score,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error calculating safety score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate safety score',
      message: error.message
    });
  }
});

/**
 * POST /api/safety-score/simulate
 * Simulate infrastructure improvements and see impact on safety score
 * Body: { lat, lng, radius, changes: { addStreetlights, addPoliceBooths, fixIssues } }
 */
router.post('/safety-score/simulate', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius, changes } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: lat and lng'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = radius || 1000;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates'
      });
    }

    const simulation = await simulateInfrastructureImpact(
      latitude,
      longitude,
      searchRadius,
      changes || {}
    );

    res.json({
      success: true,
      data: {
        location: { latitude, longitude },
        radius: searchRadius,
        changes,
        ...simulation,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error simulating infrastructure impact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate infrastructure impact',
      message: error.message
    });
  }
});

/**
 * GET /api/safety-score/areas
 * Get safety scores for all Bengaluru areas
 */
router.get('/safety-score/areas', async (req: Request, res: Response) => {
  try {
    const scores = await getAllAreaScores();

    res.json({
      success: true,
      data: {
        areas: scores,
        totalAreas: scores.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching area scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch area scores',
      message: error.message
    });
  }
});

/**
 * GET /api/safety-score/crime-data
 * Get crime rate data for Bengaluru areas
 */
router.get('/safety-score/crime-data', async (req: Request, res: Response) => {
  try {
    const crimeData = Object.entries(BENGALURU_CRIME_DATA).map(([area, data]) => ({
      area,
      ...data,
      coordinates: BENGALURU_AREA_COORDS[area],
      severity: data.crimeRate > 40 ? 'High' : data.crimeRate > 25 ? 'Medium' : 'Low'
    }));

    res.json({
      success: true,
      data: {
        crimeData,
        totalAreas: crimeData.length,
        averageCrimeRate: crimeData.reduce((sum, d) => sum + d.crimeRate, 0) / crimeData.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching crime data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crime data',
      message: error.message
    });
  }
});

/**
 * GET /api/safety-score/heatmap
 * Generate safety score heatmap data for map visualization
 */
router.get('/safety-score/heatmap', async (req: Request, res: Response) => {
  try {
    const { center_lat = 12.9716, center_lng = 77.5946, grid_size = 8 } = req.query;

    const centerLat = parseFloat(center_lat as string);
    const centerLng = parseFloat(center_lng as string);
    const gridSize = parseInt(grid_size as string);

    const heatmapData = [];

    // Generate grid of points
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = centerLat + (i - gridSize / 2) * 0.02;
        const lng = centerLng + (j - gridSize / 2) * 0.02;

        const score = await calculateSafetyScore(lat, lng, 500);

        heatmapData.push({
          latitude: lat,
          longitude: lng,
          score: score.overallScore,
          grade: score.grade,
          intensity: score.overallScore / 100
        });
      }
    }

    res.json({
      success: true,
      data: {
        center: { latitude: centerLat, longitude: centerLng },
        gridSize,
        points: heatmapData,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error generating heatmap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate heatmap',
      message: error.message
    });
  }
});

/**
 * GET /api/safety-score/trends
 * Get safety score trends over time for an area
 */
router.get('/safety-score/trends', async (req: Request, res: Response) => {
  try {
    const { lat, lng, days = 30 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: lat and lng'
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const numDays = parseInt(days as string);

    // Calculate current score
    const currentScore = await calculateSafetyScore(latitude, longitude, 1000);

    // Simulate historical trend (in real app, this would query historical data)
    const trends = [];
    for (let i = numDays; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Simulate slight variations in score over time
      const variation = Math.sin(i / 5) * 5;
      const score = Math.max(0, Math.min(100, currentScore.overallScore + variation));

      trends.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(score),
        crimeScore: Math.round(currentScore.crimeScore + variation * 0.5),
        infrastructureScore: Math.round(currentScore.infrastructureScore + variation * 0.3),
        issueScore: Math.round(currentScore.issueScore + variation * 0.2)
      });
    }

    res.json({
      success: true,
      data: {
        location: { latitude, longitude },
        currentScore: currentScore.overallScore,
        trends,
        period: `${numDays} days`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends',
      message: error.message
    });
  }
});

/**
 * GET /api/safety-score/compare
 * Compare safety scores between multiple locations
 */
router.post('/safety-score/compare', async (req: Request, res: Response) => {
  try {
    const { locations } = req.body;

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid locations array'
      });
    }

    const comparisons = await Promise.all(
      locations.map(async (loc: any) => {
        const score = await calculateSafetyScore(loc.lat, loc.lng, loc.radius || 1000);
        return {
          name: loc.name || `${loc.lat}, ${loc.lng}`,
          location: { latitude: loc.lat, longitude: loc.lng },
          ...score
        };
      })
    );

    // Sort by overall score
    comparisons.sort((a, b) => b.overallScore - a.overallScore);

    res.json({
      success: true,
      data: {
        comparisons,
        safest: comparisons[0],
        leastSafe: comparisons[comparisons.length - 1],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error comparing locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare locations',
      message: error.message
    });
  }
});

export default router;
