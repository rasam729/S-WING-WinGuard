-- ============================================
-- WinGuard Test Users SQL
-- Run this in Neon SQL Editor
-- ============================================

-- CITIZEN: citizen@winguard.com
-- Password: citizen123
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'citizen@winguard.com',
    '$2b$10$h7rd0xnlhjdacYNsBJEoOu6LGVj10iT168Qm7hLopSZr.rfhoNujW',
    'Test Citizen',
    'citizen'
)
ON CONFLICT (email) DO UPDATE
SET password_hash = '$2b$10$h7rd0xnlhjdacYNsBJEoOu6LGVj10iT168Qm7hLopSZr.rfhoNujW',
    full_name = 'Test Citizen',
    role = 'citizen';

-- OFFICIAL: official@bengaluru.gov.in
-- Password: official123
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'official@bengaluru.gov.in',
    '$2b$10$Ho9grMqqolf0QUs4R0jF7OTrxZYs2pgedhBHydK3Kbn98yu/tt27K',
    'Safety Official',
    'official'
)
ON CONFLICT (email) DO UPDATE
SET password_hash = '$2b$10$Ho9grMqqolf0QUs4R0jF7OTrxZYs2pgedhBHydK3Kbn98yu/tt27K',
    full_name = 'Safety Official',
    role = 'official';

-- Verify users were created
SELECT user_id, email, full_name, role, created_at
FROM users
WHERE email IN ('citizen@winguard.com', 'official@bengaluru.gov.in');

-- ============================================
-- LOGIN CREDENTIALS
-- ============================================
-- CITIZEN APP:
--   Email: citizen@winguard.com
--   Password: citizen123
--
-- OFFICIAL DASHBOARD:
--   Email: official@bengaluru.gov.in
--   Password: official123
-- ============================================
