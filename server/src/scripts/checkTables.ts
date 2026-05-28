/**
 * Check Database Tables
 * Verifies that all required tables exist
 */

import { pool } from '../config/postgres';

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...\n');
    
    const tables = [
      'contractors',
      'contractor_assignments',
      'budget_allocations',
      'budget_categories',
      'expenses',
      'maintenance_schedules',
      'repair_history',
      'executive_engineers',
      'routing_rules',
      'issue_assignments',
      'reports'
    ];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        
        if (result.rows[0].count > 0) {
          // Get row count
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`✓ ${table.padEnd(30)} - ${countResult.rows[0].count} rows`);
        } else {
          console.log(`❌ ${table.padEnd(30)} - NOT FOUND`);
        }
      } catch (error: any) {
        console.log(`❌ ${table.padEnd(30)} - ERROR: ${error.message}`);
      }
    }
    
    console.log('\n✅ Table check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error checking tables:', error);
    process.exit(1);
  }
}

checkTables();
