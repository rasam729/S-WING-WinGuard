// Direct database insert for official user
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function insertOfficialUser() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_HwL9Ma8tdpbi@ep-morning-dawn-aohhb76a-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Hash the password
    const password = 'official123';
    const hash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // Insert or update official user
    const result = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) 
      DO UPDATE SET 
        password_hash = $2,
        full_name = $3,
        role = $4
      RETURNING user_id, email, full_name, role
    `, ['official@bengaluru.gov.in', hash, 'Safety Official', 'official']);

    console.log('✅ Official user created/updated:');
    console.log('   Email:', result.rows[0].email);
    console.log('   Password: official123');
    console.log('   Role:', result.rows[0].role);
    console.log('   User ID:', result.rows[0].user_id);

    // Also create citizen user
    const citizenHash = await bcrypt.hash('citizen123', 10);
    const citizenResult = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) 
      DO UPDATE SET 
        password_hash = $2,
        full_name = $3,
        role = $4
      RETURNING user_id, email, full_name, role
    `, ['citizen@winguard.com', citizenHash, 'Test Citizen', 'citizen']);

    console.log('✅ Citizen user created/updated:');
    console.log('   Email:', citizenResult.rows[0].email);
    console.log('   Password: citizen123');
    console.log('   Role:', citizenResult.rows[0].role);

    console.log('\n✅ SUCCESS! You can now login with:');
    console.log('   Dashboard: official@bengaluru.gov.in / official123');
    console.log('   Citizen App: citizen@winguard.com / citizen123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

insertOfficialUser();
