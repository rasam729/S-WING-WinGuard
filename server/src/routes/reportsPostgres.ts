import { Router, Request, Response } from 'express';
import { pool } from '../config/postgres';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|heic/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware to verify JWT token
const authenticate = (req: any, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// POST /api/reports - Create new report
router.post('/', authenticate, upload.single('photo'), async (req: any, res: Response) => {
  try {
    const {
      category,
      severity,
      description,
      userExperience,
      latitude,
      longitude,
      gpsExtracted
    } = req.body;

    // Validate required fields
    if (!category || !severity || !description || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: category, severity, description, latitude, longitude'
      });
    }

    const userId = req.user.userId;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Prepare photo metadata
    const photoMetadata = req.file ? {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      gpsExtracted: gpsExtracted === 'true'
    } : null;

    // Insert report into database using PostGIS
    const result = await pool.query(
      `INSERT INTO reports (
        category, 
        severity, 
        description, 
        user_id,
        location,
        photo_url,
        photo_metadata,
        user_experience,
        critical_score,
        report_status,
        status,
        created_at
      ) VALUES (
        $1, $2, $3, $4, 
        ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,
        $7, $8, $9, $10, 'Received', 'Report Received', CURRENT_TIMESTAMP
      ) RETURNING report_id, category, severity, description, created_at`,
      [
        category,
        parseInt(severity),
        description,
        userId,
        parseFloat(longitude),
        parseFloat(latitude),
        photoUrl,
        photoMetadata ? JSON.stringify(photoMetadata) : null,
        userExperience || null,
        parseInt(severity) // Use severity as critical_score
      ]
    );

    const report = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        reportId: report.report_id,
        category: report.category,
        severity: report.severity,
        description: report.description,
        createdAt: report.created_at,
        gpsExtracted: gpsExtracted === 'true'
      }
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/reports/all - Get all reports (for officials, no auth required temporarily)
router.get('/all', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        r.report_id,
        r.category,
        r.severity,
        r.description,
        r.report_status,
        r.status,
        r.photo_url,
        r.user_experience,
        r.critical_score,
        r.created_at,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude,
        u.full_name as reporter_name,
        u.email as reporter_email
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.user_id
      ORDER BY r.created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query);
    const countResult = await pool.query('SELECT COUNT(*) FROM reports');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        reports: result.rows,
        total,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/reports - Get all reports
router.get('/', authenticate, async (req: any, res: Response) => {
  try {
    const { resolved, minSeverity, limit = 100, offset = 0 } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role; // Get user role (citizen or official)

    let query = `
      SELECT 
        r.report_id,
        r.category,
        r.severity,
        r.description,
        r.report_status,
        r.status,
        r.photo_url,
        r.user_experience,
        r.critical_score,
        r.created_at,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude,
        u.full_name as reporter_name,
        u.email as reporter_email
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    // If user is a citizen, only show their own reports
    // If user is an official, show all reports
    if (userRole === 'citizen') {
      params.push(userId);
      query += ` AND r.user_id = $${paramCount++}`;
    }

    if (resolved !== undefined) {
      query += ` AND r.status = ${resolved === 'true' ? "'Resolved'" : "'Report Received'"}`;
    }

    if (minSeverity) {
      params.push(parseInt(minSeverity as string));
      query += ` AND r.severity >= $${paramCount++}`;
    }

    query += ` ORDER BY r.created_at DESC`;
    
    params.push(parseInt(limit as string));
    query += ` LIMIT $${paramCount++}`;
    
    params.push(parseInt(offset as string));
    query += ` OFFSET $${paramCount++}`;

    const result = await pool.query(query, params);

    // Get total count based on role
    let countQuery = 'SELECT COUNT(*) FROM reports';
    let countParams: any[] = [];
    
    if (userRole === 'citizen') {
      countQuery += ' WHERE user_id = $1';
      countParams = [userId];
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        reports: result.rows,
        total,
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/reports/:id - Get single report
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        r.report_id,
        r.category,
        r.severity,
        r.description,
        r.report_status,
        r.status,
        r.photo_url,
        r.user_experience,
        r.critical_score,
        r.created_at,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude,
        u.full_name as reporter_name,
        u.email as reporter_email
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.user_id
      WHERE r.report_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
