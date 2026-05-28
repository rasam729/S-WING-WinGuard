/**
 * Contractors Routes
 * API endpoints for contractor management
 */

import { Router, Request, Response } from 'express';
import { pool } from '../config/postgres';

const router = Router();

// Get all contractors
router.get('/contractors', async (req: Request, res: Response) => {
  try {
    const { status, specialization, minRating } = req.query;
    
    let query = 'SELECT * FROM contractors WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (specialization) {
      query += ` AND specialization::text LIKE $${paramCount}`;
      params.push(`%${specialization}%`);
      paramCount++;
    }
    
    if (minRating) {
      query += ` AND rating >= $${paramCount}`;
      params.push(minRating);
      paramCount++;
    }
    
    query += ' ORDER BY rating DESC, completed_projects DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching contractors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contractors'
    });
  }
});

// Get contractor by ID
router.get('/contractors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM contractors WHERE contractor_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contractor not found'
      });
    }
    
    // Get contractor assignments
    const assignments = await pool.query(
      'SELECT * FROM contractor_assignments WHERE contractor_id = $1 ORDER BY assigned_at DESC',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        assignments: assignments.rows
      }
    });
  } catch (error) {
    console.error('Error fetching contractor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contractor'
    });
  }
});

// Create new contractor
router.post('/contractors', async (req: Request, res: Response) => {
  try {
    const {
      contractor_id,
      company_name,
      registration_number,
      contact_person,
      email,
      phone,
      alternate_phone,
      address,
      city,
      state,
      country,
      pincode,
      specialization,
      certifications,
      experience,
      registered_capital,
      annual_turnover,
      gst_number,
      pan_number
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO contractors (
        contractor_id, company_name, registration_number, contact_person,
        email, phone, alternate_phone, address, city, state, country, pincode,
        specialization, certifications, experience, registered_capital,
        annual_turnover, gst_number, pan_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        contractor_id, company_name, registration_number, contact_person,
        email, phone, alternate_phone, address, city, state, country, pincode,
        JSON.stringify(specialization), JSON.stringify(certifications), experience,
        registered_capital, annual_turnover, gst_number, pan_number
      ]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating contractor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contractor'
    });
  }
});

// Update contractor
router.put('/contractors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates)
      .filter(key => key !== 'contractor_id')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.keys(updates)
      .filter(key => key !== 'contractor_id')
      .map(key => {
        if (typeof updates[key] === 'object') {
          return JSON.stringify(updates[key]);
        }
        return updates[key];
      });
    
    const result = await pool.query(
      `UPDATE contractors SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE contractor_id = $1 RETURNING *`,
      [id, ...values]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contractor not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating contractor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contractor'
    });
  }
});

// Assign contractor to issue
router.post('/contractors/:id/assign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      assignment_id,
      issue_id,
      assigned_by,
      expected_completion_date,
      contract_value,
      advance_payment,
      milestones
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO contractor_assignments (
        assignment_id, issue_id, contractor_id, assigned_by,
        expected_completion_date, contract_value, advance_payment, milestones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        assignment_id, issue_id, id, assigned_by,
        expected_completion_date, contract_value, advance_payment,
        JSON.stringify(milestones)
      ]
    );
    
    // Update contractor's ongoing projects count
    await pool.query(
      'UPDATE contractors SET ongoing_projects = ongoing_projects + 1 WHERE contractor_id = $1',
      [id]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error assigning contractor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign contractor'
    });
  }
});

// Get contractor performance metrics
router.get('/contractors/:id/performance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const contractor = await pool.query(
      'SELECT * FROM contractors WHERE contractor_id = $1',
      [id]
    );
    
    if (contractor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contractor not found'
      });
    }
    
    const assignments = await pool.query(
      'SELECT * FROM contractor_assignments WHERE contractor_id = $1',
      [id]
    );
    
    const completed = assignments.rows.filter(a => a.status === 'completed');
    const inProgress = assignments.rows.filter(a => a.status === 'in_progress');
    const avgRating = completed.reduce((sum, a) => sum + (a.overall_rating || 0), 0) / (completed.length || 1);
    
    res.json({
      success: true,
      data: {
        contractor: contractor.rows[0],
        totalAssignments: assignments.rows.length,
        completedProjects: completed.length,
        ongoingProjects: inProgress.length,
        averageRating: avgRating.toFixed(2),
        recentAssignments: assignments.rows.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching contractor performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contractor performance'
    });
  }
});

// Rate contractor
router.post('/contractors/:id/rate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignment_id, quality_rating, timeliness_rating, communication_rating } = req.body;
    
    const overall_rating = (quality_rating + timeliness_rating + communication_rating) / 3;
    
    await pool.query(
      `UPDATE contractor_assignments 
       SET quality_rating = $1, timeliness_rating = $2, communication_rating = $3, overall_rating = $4
       WHERE assignment_id = $5`,
      [quality_rating, timeliness_rating, communication_rating, overall_rating, assignment_id]
    );
    
    // Update contractor's overall rating
    const ratings = await pool.query(
      'SELECT AVG(overall_rating) as avg_rating FROM contractor_assignments WHERE contractor_id = $1 AND overall_rating IS NOT NULL',
      [id]
    );
    
    await pool.query(
      'UPDATE contractors SET rating = $1 WHERE contractor_id = $2',
      [ratings.rows[0].avg_rating, id]
    );
    
    res.json({
      success: true,
      message: 'Contractor rated successfully'
    });
  } catch (error) {
    console.error('Error rating contractor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate contractor'
    });
  }
});

export default router;
