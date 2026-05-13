const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'road',
  database: 'inventory_db'
});

async function createOfficialUser() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    
    const email = 'official@bengaluru.gov.in';
    const password = 'official123';
    const fullName = 'City Official';
    const role = 'official';
    
    // Hash password
    console.log('🔐 Hashing password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists, updating password...');
      await pool.query(
        'UPDATE users SET password_hash = $1, role = $2 WHERE email = $3',
        [passwordHash, role, email]
      );
      console.log('✅ Password updated successfully!');
    } else {
      console.log('➕ Creating new official user...');
      await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        [email, passwordHash, fullName, role]
      );
      console.log('✅ Official user created successfully!');
    }
    
    console.log('\n📋 Official Login Credentials:');
    console.log('   Email: official@bengaluru.gov.in');
    console.log('   Password: official123');
    console.log('\n🌐 Login at: http://localhost:5175');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createOfficialUser();
