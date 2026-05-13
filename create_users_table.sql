-- Create users table and related tables for WinGuard authentication

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(50) DEFAULT 'citizen'
);

-- User sessions table for JWT tokens
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(token_hash);

-- Enhance reports table with user relationship
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(user_id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo_metadata JSONB;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_experience TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS critical_score INTEGER DEFAULT 5;

-- Create index for user reports
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_critical_score ON reports(critical_score);

-- Success message
SELECT 'Users table created successfully!' AS status;
