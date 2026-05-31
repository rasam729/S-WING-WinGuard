import { Router, Request, Response } from 'express';
import { pool } from '../config/postgres';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';

const router = Router();

// Socket.IO instance (will be set by server.ts)
let io: SocketIOServer | null = null;

export function setReportsSocketIO(ioInstance: SocketIOServer) {
  io = ioInstance;
}

<<<<<<< Updated upstream
function inferRoadType(category: string, severity: number, description = '') {
  const text = `${category || ''} ${description || ''}`.toLowerCase();
  if (/highway|motorway|autobahn|i-|expressway|nh\b/.test(text) || severity >= 9) return 'NH';
  if (/state|state highway|sh\b/.test(text) || severity >= 6) return 'SH';
  return 'MDR';
}

=======
>>>>>>> Stashed changes
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

    // Infer road type (not persisted if DB column missing) and Insert report into database using PostGIS
    const road_type = inferRoadType(category, parseInt(severity || '5'), description);
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

    // Create a notification for officials
    try {
      const notifMessage = `New road safety report submitted: ${report.category} - ${report.description.substring(0, 50)}${report.description.length > 50 ? '...' : ''}`;
      const notifResult = await pool.query(
        `INSERT INTO notifications (user_id, report_id, message, type, sent_at)
         VALUES (NULL, $1, $2, 'info', CURRENT_TIMESTAMP)
         RETURNING *`,
        [report.report_id, notifMessage]
      );
      
      // Emit websocket events for real-time notification
      if (io) {
        // Broadcast new report to all officials
        io.emit('new-report', {
          report_id: report.report_id,
          category: report.category,
          severity: report.severity,
          description: report.description,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          created_at: report.created_at,
<<<<<<< Updated upstream
          status: 'Report Received',
          road_type
=======
          status: 'Report Received'
>>>>>>> Stashed changes
        });

        // Broadcast new notification to updating clients
        io.emit('new-notification', {
          notification: notifResult.rows[0],
          message: 'New notification received'
        });
        console.log('📡 Broadcasted new-report and new-notification for report:', report.report_id);
      }
    } catch (notifErr) {
      console.error('Error creating official notification:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        reportId: report.report_id,
        category: report.category,
        severity: report.severity,
        description: report.description,
        roadType: road_type,
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
        r.road_type,
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
        r.user_id,
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

// PATCH /api/reports/:id/status - Update report status (for officials)
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Get the report details including user_id before updating
    const reportResult = await pool.query(
      'SELECT user_id, category, description FROM reports WHERE report_id = $1',
      [id]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = reportResult.rows[0];

    // Update the report status
    const result = await pool.query(
      `UPDATE reports 
       SET status = $1, report_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE report_id = $2
       RETURNING report_id, status, updated_at`,
      [status, id]
    );

    // If status is updated, send notification to the citizen who reported it
    if (report.user_id) {
      try {
        let message = '';
        let type = 'info';
        
        if (status === 'Resolved') {
          message = `Great news! The ${report.category} issue you reported has been resolved. Thank you for helping make your community safer!`;
          type = 'success';
        } else if (status === 'In Progress') {
          message = `Update: The ${report.category} issue you reported is now being fixed. We will update you once it's resolved.`;
          type = 'info';
        } else {
          message = `Update: The status of your report for ${report.category} has been changed to "${status}".`;
          type = 'info';
        }

        const notifResult = await pool.query(
          `INSERT INTO notifications (user_id, report_id, message, type, sent_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING *`,
          [report.user_id, id, message, type]
        );

        // Emit new-notification socket event so the citizen PWA gets it in real-time
        if (io) {
          io.emit('new-notification', {
            notification: notifResult.rows[0],
            message: 'New notification received'
          });
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    // Emit Socket.IO event for real-time updates
    if (io) {
      io.emit('report-status-changed', {
        reportId: id,
        status: status,
        userId: report.user_id
      });
      
      if (status === 'Resolved') {
        io.emit('report-resolved', {
          reportId: id,
          userId: report.user_id
        });
      }
    }

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/reports/:id/resolve - Mark report as resolved
router.patch('/:id/resolve', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const officialId = req.user.userId;

    // Update report status
    const result = await pool.query(
      `UPDATE reports 
       SET status = 'Resolved', 
           resolved_at = CURRENT_TIMESTAMP,
           resolved_by = $1
       WHERE report_id = $2
       RETURNING report_id, category, user_id, description,
                 ST_X(location::geometry) as longitude,
                 ST_Y(location::geometry) as latitude`,
      [officialId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = result.rows[0];

    // Create notification for the citizen who reported it
    if (report.user_id) {
      try {
        const message = `Great news! The ${report.category} issue you reported has been resolved. Thank you for helping make your community safer!`;
        const notifResult = await pool.query(
          `INSERT INTO notifications (user_id, report_id, message, type, sent_at)
           VALUES ($1, $2, $3, 'success', CURRENT_TIMESTAMP)
           RETURNING *`,
          [report.user_id, id, message]
        );

        // Emit WebSocket events for real-time notifications
        if (io) {
          // Notify the specific citizen
          io.emit('report-resolved', {
            reportId: report.report_id,
            userId: report.user_id,
            category: report.category,
            message: message
          });

          // Broadcast notification update
          io.emit('new-notification', {
            notification: notifResult.rows[0],
            userId: report.user_id,
            message: 'New notification received'
          });

          // Broadcast status change to update maps
          io.emit('report-status-changed', {
            reportId: id,
            status: 'Resolved',
            userId: report.user_id
          });

          console.log('📡 Broadcasted report-resolved event for report:', report.report_id);
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    res.json({
      success: true,
      message: 'Report marked as resolved',
      data: report
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
