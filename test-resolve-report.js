/**
 * Test Resolve Report and Create Notification
 * This script manually resolves a report and creates a notification
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'inventory_db',
  user: 'postgres',
  password: 'road'
});

async function testResolveReport() {
  try {
    console.log('🔄 Testing report resolution and notification creation...\n');
    
    // Get the most recent unresolved report
    const reportResult = await pool.query(`
      SELECT report_id, category, user_id, status
      FROM reports
      WHERE status = 'Report Received'
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (reportResult.rows.length === 0) {
      console.log('❌ No unresolved reports found. Please submit a report first.');
      return;
    }
    
    const report = reportResult.rows[0];
    console.log('📋 Found report to resolve:');
    console.table([report]);
    
    // Resolve the report
    console.log('\n🔧 Resolving report...');
    await pool.query(`
      UPDATE reports
      SET status = 'Resolved',
          resolved_at = CURRENT_TIMESTAMP,
          resolved_by = 2
      WHERE report_id = $1
    `, [report.report_id]);
    
    console.log('✅ Report marked as resolved!');
    
    // Create notification
    console.log('\n📬 Creating notification...');
    const message = `Great news! The ${report.category} issue you reported has been resolved. Thank you for helping make your community safer!`;
    
    const notifResult = await pool.query(`
      INSERT INTO notifications (user_id, report_id, message, type, sent_at)
      VALUES ($1, $2, $3, 'success', CURRENT_TIMESTAMP)
      RETURNING *
    `, [report.user_id, report.report_id, message]);
    
    console.log('✅ Notification created:');
    console.table([notifResult.rows[0]]);
    
    // Verify notification exists
    console.log('\n🔍 Verifying notification in database...');
    const verifyResult = await pool.query(`
      SELECT n.*, r.category, r.status
      FROM notifications n
      LEFT JOIN reports r ON n.report_id = r.report_id
      WHERE n.notification_id = $1
    `, [notifResult.rows[0].notification_id]);
    
    console.log('✅ Verification successful:');
    console.table(verifyResult.rows);
    
    console.log('\n🎉 SUCCESS! Now check the Alerts page in the citizen app!');
    console.log('   URL: http://localhost:5173/alerts');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

testResolveReport();
