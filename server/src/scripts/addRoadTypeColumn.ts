import { pool } from '../config/postgres';

async function run() {
  try {
    console.log('Adding road_type column if not exists...');
    await pool.query("ALTER TABLE reports ADD COLUMN IF NOT EXISTS road_type VARCHAR(20);");
    console.log('✅ road_type column ensured');
    process.exit(0);
  } catch (err) {
    console.error('Failed to add road_type column:', err);
    process.exit(1);
  }
}

run();
