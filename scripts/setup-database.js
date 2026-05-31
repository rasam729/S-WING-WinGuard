const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'road',
  database: 'inventory_db'
});

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, 'create_users_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📝 Executing SQL script...');
    await pool.query(sql);
    
    console.log('✅ Database setup completed successfully!');
    console.log('✅ Users table created');
    console.log('✅ User sessions table created');
    console.log('✅ Reports table enhanced');
    
    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_sessions', 'reports')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables in database:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
