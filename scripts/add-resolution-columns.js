const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'road',
  database: 'inventory_db'
});

async function addResolutionColumns() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    
    // Add resolved_at and resolved_by columns
    await pool.query(`
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS resolved_by INTEGER REFERENCES users(user_id);
    `);
    
    console.log('✅ Added resolved_at and resolved_by columns');
    
    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_resolved_at ON reports(resolved_at);
    `);
    
    console.log('✅ Created index on resolved_at');
    console.log('✅ Database schema updated successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addResolutionColumns();
