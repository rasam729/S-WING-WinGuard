import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/postgres';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, 'citizen')
       RETURNING user_id, email, full_name, phone, role, created_at`,
      [email, passwordHash, fullName || null, phone || null]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Store session
    const tokenHash = await bcrypt.hash(token, 5);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.user_id, tokenHash, expiresAt, req.ip, req.get('user-agent')]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          userId: user.user_id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const result = await pool.query(
      `SELECT user_id, email, password_hash, full_name, phone, profile_picture, role, is_active
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Store session
    const tokenHash = await bcrypt.hash(token, 5);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.user_id, tokenHash, expiresAt, req.ip, req.get('user-agent')]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: user.user_id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          profilePicture: user.profile_picture,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // Delete session
      const decoded: any = jwt.verify(token, JWT_SECRET);
      await pool.query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [decoded.userId]
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

// Get current user profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      `SELECT user_id, email, full_name, phone, profile_picture, role, created_at, last_login
       FROM users WHERE user_id = $1 AND is_active = true`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: result.rows[0].user_id,
        email: result.rows[0].email,
        fullName: result.rows[0].full_name,
        phone: result.rows[0].phone,
        profilePicture: result.rows[0].profile_picture,
        role: result.rows[0].role,
        createdAt: result.rows[0].created_at,
        lastLogin: result.rows[0].last_login
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Update user profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { fullName, phone, profilePicture } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           profile_picture = COALESCE($3, profile_picture)
       WHERE user_id = $4
       RETURNING user_id, email, full_name, phone, profile_picture, role`,
      [fullName, phone, profilePicture, decoded.userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

export default router;
