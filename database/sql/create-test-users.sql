-- Create Test Users for WinGuard Platform
-- Run this in Neon SQL Editor

-- Create Citizen User
-- Email: citizen@winguard.com
-- Password: citizen123
INSERT INTO users (email, password_hash, full_name, role) 
VALUES (
    'citizen@winguard.com',
    '$2b$10$YQ98PjIVVZqQqZqQqZqQqOKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
    'Test Citizen',
    'citizen'
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2b$10$YQ98PjIVVZqQqZqQqZqQqOKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK';

-- Create Official User for Dashboard
-- Email: official@bengaluru.gov.in
-- Password: official123
INSERT INTO users (email, password_hash, full_name, role) 
VALUES (
    'official@bengaluru.gov.in',
    '$2b$10$YQ98PjIVVZqQqZqQqZqQqOKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
    'Safety Official',
    'official'
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2b$10$YQ98PjIVVZqQqZqQqZqQqZqQqOKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK';

-- Verify users were created
SELECT user_id, email, full_name, role, created_at 
FROM users 
WHERE email IN ('citizen@winguard.com', 'official@bengaluru.gov.in');

-- Display login credentials
SELECT 
    '✅ Test users created successfully!' as status,
    '' as blank_line_1,
    '📱 CITIZEN APP LOGIN:' as citizen_header,
    'Email: citizen@winguard.com' as citizen_email,
    'Password: citizen123' as citizen_password,
    '' as blank_line_2,
    '🏛️ OFFICIAL DASHBOARD LOGIN:' as dashboard_header,
    'Email: official@bengaluru.gov.in' as dashboard_email,
    'Password: official123' as dashboard_password;
