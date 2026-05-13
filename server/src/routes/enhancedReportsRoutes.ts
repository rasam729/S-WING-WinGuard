import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ExifParser from 'exif-parser';
import { pool } from '../config/postgres';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/reports');
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|heic/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, HEIC) are allowed!'));
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Extract GPS data from EXIF
function extractGPSFromEXIF(buffer: Buffer): { latitude: number | null; longitude: number | null; timestamp: Date | null } {
  try {
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    if (result.tags && result.tags.GPSLatitude && result.tags.GPSLongitude) {
      return {
        latitude: result.tags.GPSLatitude,
        longitude: result.tags.GPSLongitude,
        timestamp: result.tags.DateTimeOriginal ? new Date(result.tags.DateTimeOriginal * 1000) : null
      };
    }
  } catch (error) {
    console.error('EXIF parsing error:', error);
  }

  return { latitude: null, longitude: null, timestamp: null };
}

// Submit report with photo
router.post('/submit-with-photo', authenticateToken, upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const {
      category,
      severity,
      description,
      userExperience,
      criticalScore,
      latitude: providedLat,
      longitude: providedLng
    } = req.body;

    let latitude = parseFloat(providedLat);
    let longitude = parseFloat(providedLng);
    let photoUrl = null;
    let photoMetadata = null;

    // Process uploaded photo
    if (req.file) {
      photoUrl = `/uploads/reports/${req.file.filename}`;

      // Extract EXIF data
      const fileBuffer = fs.readFileSync(req.file.path);
      const gpsData = extractGPSFromEXIF(fileBuffer);

      // Use GPS data from photo if available and no location provided
      if (gpsData.latitude && gpsData.longitude) {
        if (!providedLat || !providedLng) {
          latitude = gpsData.latitude;
          longitude = gpsData.longitude;
        }

        photoMetadata = {
          hasGPS: true,
          gpsLatitude: gpsData.latitude,
          gpsLongitude: gpsData.longitude,
          captureTime: gpsData.timestamp,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        };
      } else {
        photoMetadata = {
          hasGPS: false,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        };
      }
    }

    // Validate location
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location is required. Either provide coordinates or upload a geotagged photo.'
      });
    }

    // Insert report
    const result = await pool.query(
      `INSERT INTO reports (
        user_id, category, severity, description, user_experience, 
        critical_score, latitude, longitude, photo_url, photo_metadata,
        location, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
              ST_SetSRID(ST_MakePoint($8, $7), 4326), 'Report Received')
      RETURNING report_id, category, severity, description, user_experience,
                critical_score, latitude, longitude, photo_url, created_at, status`,
      [
        userId,
        category,
        parseInt(severity) || 5,
        description,
        userExperience,
        parseInt(criticalScore) || parseInt(severity) || 5,
        latitude,
        longitude,
        photoUrl,
        photoMetadata ? JSON.stringify(photoMetadata) : null
      ]
    );

    const report = result.rows[0];

    // Send notification to officials
    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       SELECT user_id, $1, 'alert'
       FROM users WHERE role = 'official'`,
      [`New ${category} report with ${criticalScore >= 8 ? 'CRITICAL' : 'high'} severity at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`]
    );

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        reportId: report.report_id,
        category: report.category,
        severity: report.severity,
        criticalScore: report.critical_score,
        location: {
          latitude: report.latitude,
          longitude: report.longitude
        },
        photoUrl: report.photo_url,
        gpsExtracted: photoMetadata?.hasGPS || false,
        status: report.status,
        createdAt: report.created_at
      }
    });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's reports
router.get('/my-reports', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      `SELECT report_id, category, severity, description, user_experience,
              critical_score, latitude, longitude, photo_url, status,
              created_at, estimated_fix_date, upvotes, downvotes
       FROM reports
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// Vote on report
router.post('/:reportId/vote', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { reportId } = req.params;
    const { voteType } = req.body; // 'up' or 'down'

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type. Must be "up" or "down"'
      });
    }

    // Check if user already voted
    const existingVote = await pool.query(
      'SELECT vote_type FROM report_votes WHERE report_id = $1 AND user_id = $2',
      [reportId, userId]
    );

    if (existingVote.rows.length > 0) {
      // Update existing vote
      await pool.query(
        'UPDATE report_votes SET vote_type = $1 WHERE report_id = $2 AND user_id = $3',
        [voteType, reportId, userId]
      );
    } else {
      // Insert new vote
      await pool.query(
        'INSERT INTO report_votes (report_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [reportId, userId, voteType]
      );
    }

    // Update vote counts
    const voteCounts = await pool.query(
      `SELECT 
        SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END) as upvotes,
        SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END) as downvotes
       FROM report_votes
       WHERE report_id = $1`,
      [reportId]
    );

    await pool.query(
      'UPDATE reports SET upvotes = $1, downvotes = $2 WHERE report_id = $3',
      [voteCounts.rows[0].upvotes, voteCounts.rows[0].downvotes, reportId]
    );

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        upvotes: parseInt(voteCounts.rows[0].upvotes),
        downvotes: parseInt(voteCounts.rows[0].downvotes)
      }
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote'
    });
  }
});

export default router;
