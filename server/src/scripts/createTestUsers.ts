import bcrypt from 'bcrypt';
import { pool } from '../config/postgres';

async function createTestUsers() {
  try {
    const users = [
      {
        email: 'citizen@winguard.com',
        password: 'citizen123',
        fullName: 'Test Citizen',
        role: 'citizen'
      },
      {
        email: 'official@bengaluru.gov.in',
        password: 'official123',
        fullName: 'Safety Official',
        role: 'official'
      }
    ];

    console.log('Creating test users...\n');

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT user_id FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`✅ User already exists: ${userData.email}`);
        continue;
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Insert user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id, email, full_name, role`,
        [userData.email, passwordHash, userData.fullName, userData.role]
      );

      console.log(`✅ Created ${userData.role}: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   User ID: ${result.rows[0].user_id}\n`);
    }

    console.log('-----------------------------------');
    console.log('Test users created successfully!');
    console.log('-----------------------------------');
    console.log('\nCitizen App Login:');
    console.log('Email: citizen@winguard.com');
    console.log('Password: citizen123');
    console.log('\nOfficial Dashboard Login:');
    console.log('Email: official@bengaluru.gov.in');
    console.log('Password: official123');
    console.log('-----------------------------------');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await pool.end();
  }
}

createTestUsers();
