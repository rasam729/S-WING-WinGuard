/**
 * Map Data Routes
 * Handles spatial queries for Leaflet map integration
 */

import { Router, Request, Response } from 'express';
import pool from '../config/postgres';

const router = Router();

/**
 * GET /api/map-data
 * Fetches all map markers from the map_dashboard_data view
 * Returns: longitude, latitude, category, status for Leaflet markers
 */
router.get('/map-data', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        report_id,
        longitude,
        latitude,
        category,
        status,
        description,
        severity,
        amount_sanctioned,
        created_at
      FROM map_dashboard_data
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching map data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch map data',
      message: error.message
    });
  }
});

/**
 * GET /api/map-data/bounds
 * Fetches map data within specific bounds (for viewport optimization)
 */
router.get('/map-data/bounds', async (req: Request, res: Response) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    
    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({
        success: false,
        error: 'Missing bounds parameters'
      });
    }
    
    const query = `
      SELECT 
        report_id,
        longitude,
        latitude,
        category,
        status,
        description,
        severity,
        created_at
      FROM map_dashboard_data
      WHERE longitude BETWEEN $1 AND $3
        AND latitude BETWEEN $2 AND $4
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [minLng, minLat, maxLng, maxLat]);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching bounded map data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bounded map data',
      message: error.message
    });
  }
});

/**
 * GET /api/map-data/radius
 * Fetches reports within a radius (in meters) from a point
 * Used for 5km radius feature
 */
router.get('/map-data/radius', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Missing latitude or longitude'
      });
    }
    
    const query = `
      SELECT 
        report_id,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        category,
        status,
        description,
        severity,
        created_at,
        ST_Distance(
          location,
          ST_GeogFromText('POINT(' || $2 || ' ' || $1 || ')')
        ) as distance_meters
      FROM reports
      WHERE ST_DWithin(
        location,
        ST_GeogFromText('POINT(' || $2 || ' ' || $1 || ')'),
        $3
      )
      ORDER BY distance_meters ASC
    `;
    
    const result = await pool.query(query, [lat, lng, radius]);
    
    res.json({
      success: true,
      count: result.rows.length,
      radius: `${radius}m`,
      center: { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching radius map data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch radius map data',
      message: error.message
    });
  }
});

/**
 * GET /api/map-data/stats
 * Fetches aggregated statistics for the dashboard
 */
router.get('/map-data/stats', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN category = 'Pothole' THEN 1 END) as potholes,
        COUNT(CASE WHEN category = 'Streetlight' THEN 1 END) as streetlights,
        COUNT(CASE WHEN category = 'Crime' THEN 1 END) as crime_reports
      FROM reports
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

export default router;
