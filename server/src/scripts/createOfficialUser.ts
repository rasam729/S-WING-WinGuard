import bcrypt from 'bcrypt';
import { pool } from '../config/postgres';

async function createOfficialUser() {
  try {
    const email = 'official@bengaluru.gov.in';
    const password = 'official123';
    const fullName = 'Safety Official';
    const role = 'official';

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ Official user already exists');
      console.log('Email:', email);
      console.log('Password:', password);
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert official user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, email, full_name, role`,
      [email, passwordHash, fullName, role]
    );

    console.log('✅ Official user created successfully!');
    console.log('-----------------------------------');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', role);
    console.log('User ID:', result.rows[0].user_id);
    console.log('-----------------------------------');
    console.log('Use these credentials to login to the dashboard');

  } catch (error) {
    console.error('❌ Error creating official user:', error);
  } finally {
    await pool.end();
  }
}

createOfficialUser();
