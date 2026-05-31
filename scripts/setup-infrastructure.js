/**
 * Setup Infrastructure Table
 * Run with: node setup-infrastructure.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function setupInfrastructure() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✓ Connected');

    console.log('\n📋 Creating infrastructure table...');
    
    // Read SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'add-infrastructure-table.sql'), 'utf8');
    
    // Execute SQL
    await client.query(sqlFile);
    
    console.log('✓ Infrastructure table created and populated');
    
    // Verify
    const result = await client.query(`
      SELECT 
        type,
        status,
        COUNT(*) as count
      FROM infrastructure
      GROUP BY type, status
      ORDER BY type, status
    `);
    
    console.log('\n📊 Infrastructure Summary:');
    result.rows.forEach(row => {
      console.log(`  ${row.type} (${row.status}): ${row.count}`);
    });
    
    console.log('\n✅ Setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupInfrastructure();
