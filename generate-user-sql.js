// Generate SQL with proper bcrypt hashes for test users
// Run with: node generate-user-sql.js

const bcrypt = require('bcrypt');

async function generateUserSQL() {
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

  console.log('-- ============================================');
  console.log('-- WinGuard Test Users SQL');
  console.log('-- Run this in Neon SQL Editor');
  console.log('-- ============================================\n');

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    
    console.log(`-- ${user.role.toUpperCase()}: ${user.email}`);
    console.log(`-- Password: ${user.password}`);
    console.log(`INSERT INTO users (email, password_hash, full_name, role)`);
    console.log(`VALUES (`);
    console.log(`    '${user.email}',`);
    console.log(`    '${hash}',`);
    console.log(`    '${user.fullName}',`);
    console.log(`    '${user.role}'`);
    console.log(`)`);
    console.log(`ON CONFLICT (email) DO UPDATE`);
    console.log(`SET password_hash = '${hash}',`);
    console.log(`    full_name = '${user.fullName}',`);
    console.log(`    role = '${user.role}';\n`);
  }

  console.log('-- Verify users');
  console.log(`SELECT user_id, email, full_name, role, created_at`);
  console.log(`FROM users`);
  console.log(`WHERE email IN ('citizen@winguard.com', 'official@bengaluru.gov.in');\n`);

  console.log('-- ============================================');
  console.log('-- LOGIN CREDENTIALS');
  console.log('-- ============================================');
  console.log('-- CITIZEN APP:');
  console.log('--   Email: citizen@winguard.com');
  console.log('--   Password: citizen123');
  console.log('--');
  console.log('-- OFFICIAL DASHBOARD:');
  console.log('--   Email: official@bengaluru.gov.in');
  console.log('--   Password: official123');
  console.log('-- ============================================');
}

generateUserSQL().catch(console.error);
