import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    console.log('📍 Database URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../../database-auth-enhancements.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Users table created');
    console.log('✅ Saved routes table created');
    console.log('✅ Report votes table created');
    console.log('✅ User sessions table created');
    console.log('✅ Functions created');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
