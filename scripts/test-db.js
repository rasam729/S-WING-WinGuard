const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'road',
  database: 'inventory_db'
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query successful:', result.rows[0]);
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:');
    console.error('Error:', err.message);
    console.error('\nPlease check:');
    console.error('1. PostgreSQL is running');
    console.error('2. Password is correct: roadwatch123');
    console.error('3. Database "inventory_db" exists');
    console.error('4. User "postgres" has access');
    process.exit(1);
  }
}

testConnection();
