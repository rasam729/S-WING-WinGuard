/**
 * Setup Notifications Table
 * Creates the notifications table in PostgreSQL database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'inventory_db',
  user: 'postgres',
  password: 'road'
});

async function setupNotifications() {
  try {
    console.log('🔄 Setting up notifications table...');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, 'create-notifications-table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute SQL
    await pool.query(sql);
    
    console.log('✅ Notifications table created successfully!');
    
    // Verify table exists
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Notifications table structure:');
    console.table(result.rows);
    
    // Check if there are any notifications
    const countResult = await pool.query('SELECT COUNT(*) FROM notifications');
    console.log(`\n📊 Total notifications: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error setting up notifications:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

setupNotifications();
