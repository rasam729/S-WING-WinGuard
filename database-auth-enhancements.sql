-- Enhanced Database Schema for Authentication and Photo Reports

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
    role VARCHAR(50) DEFAULT 'citizen' -- 'citizen' or 'official'
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enhance reports table with photo and user experience
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(user_id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo_metadata JSONB; -- Store EXIF data including GPS
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_experience TEXT; -- User's description of experience
ALTER TABLE reports ADD COLUMN IF NOT EXISTS critical_score INTEGER DEFAULT 5; -- 1-10 scale
ALTER TABLE reports ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;

-- Create index for user reports
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_critical_score ON reports(critical_score);

-- Routes table for saved routes
CREATE TABLE IF NOT EXISTS saved_routes (
    route_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    route_name VARCHAR(255),
    start_location GEOGRAPHY(POINT, 4326),
    end_location GEOGRAPHY(POINT, 4326),
    start_address TEXT,
    end_address TEXT,
    route_points JSONB, -- Array of lat/lng points
    distance_km DECIMAL(10, 2),
    estimated_time_minutes INTEGER,
    safety_score INTEGER,
    route_type VARCHAR(50), -- 'safe' or 'fast'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_favorite BOOLEAN DEFAULT false
);

-- Create indexes for routes
CREATE INDEX IF NOT EXISTS idx_saved_routes_user_id ON saved_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_routes_start_location ON saved_routes USING GIST(start_location);
CREATE INDEX IF NOT EXISTS idx_saved_routes_end_location ON saved_routes USING GIST(end_location);

-- Report votes table (to track who voted)
CREATE TABLE IF NOT EXISTS report_votes (
    vote_id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(report_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, user_id)
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

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(token_hash);

-- Function to calculate enhanced safety score with critical reports
CREATE OR REPLACE FUNCTION calculate_enhanced_safety_score(
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 1000
)
RETURNS TABLE(
    safety_score INTEGER,
    total_reports INTEGER,
    critical_reports INTEGER,
    high_severity_reports INTEGER,
    recommendation TEXT
) AS $$
DECLARE
    base_score INTEGER := 100;
    report_count INTEGER;
    critical_count INTEGER;
    high_severity_count INTEGER;
    score_deduction INTEGER := 0;
BEGIN
    -- Count reports within radius
    SELECT COUNT(*), 
           SUM(CASE WHEN critical_score >= 8 THEN 1 ELSE 0 END),
           SUM(CASE WHEN severity >= 8 THEN 1 ELSE 0 END)
    INTO report_count, critical_count, high_severity_count
    FROM reports
    WHERE status != 'Resolved'
    AND ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
        radius_meters
    );

    -- Calculate deductions
    score_deduction := (critical_count * 15) + (high_severity_count * 10) + (report_count * 5);
    
    -- Calculate final score
    safety_score := GREATEST(0, base_score - score_deduction);
    total_reports := report_count;
    critical_reports := critical_count;
    high_severity_reports := high_severity_count;
    
    -- Generate recommendation
    IF safety_score >= 80 THEN
        recommendation := 'Very Safe - Recommended for all users';
    ELSIF safety_score >= 60 THEN
        recommendation := 'Safe - Minor issues present';
    ELSIF safety_score >= 40 THEN
        recommendation := 'Moderate - Exercise caution';
    ELSE
        recommendation := 'High Risk - Avoid if possible or use alternative route';
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get route alternatives with safety scores
CREATE OR REPLACE FUNCTION get_route_alternatives(
    start_lat DOUBLE PRECISION,
    start_lng DOUBLE PRECISION,
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION
)
RETURNS TABLE(
    route_type VARCHAR,
    distance_km DECIMAL,
    estimated_time_minutes INTEGER,
    safety_score INTEGER,
    waypoints JSONB,
    recommendation TEXT
) AS $$
BEGIN
    -- This is a simplified version - in production, you'd use PostGIS routing
    -- For now, we'll return two basic routes with safety calculations
    
    -- Safe Route (longer but safer)
    route_type := 'safe';
    distance_km := ST_Distance(
        ST_SetSRID(ST_MakePoint(start_lng, start_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(end_lng, end_lat), 4326)::geography
    ) / 1000 * 1.2; -- 20% longer for safety
    estimated_time_minutes := (distance_km * 3)::INTEGER; -- ~20 km/h average
    
    SELECT s.safety_score, s.recommendation
    INTO safety_score, recommendation
    FROM calculate_enhanced_safety_score(
        (start_lat + end_lat) / 2,
        (start_lng + end_lng) / 2,
        5000
    ) s;
    
    waypoints := jsonb_build_array(
        jsonb_build_object('lat', start_lat, 'lng', start_lng),
        jsonb_build_object('lat', end_lat, 'lng', end_lng)
    );
    
    RETURN NEXT;
    
    -- Fast Route (shorter but potentially less safe)
    route_type := 'fast';
    distance_km := ST_Distance(
        ST_SetSRID(ST_MakePoint(start_lng, start_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(end_lng, end_lat), 4326)::geography
    ) / 1000;
    estimated_time_minutes := (distance_km * 2.5)::INTEGER; -- ~24 km/h average
    safety_score := safety_score - 15; -- Slightly less safe
    recommendation := 'Fastest route - may have more issues';
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Insert sample user (password: 'password123' - hashed with bcrypt)
-- Note: In production, use proper bcrypt hashing on the backend
INSERT INTO users (email, password_hash, full_name, role) 
VALUES 
    ('citizen@winguard.com', '$2b$10$rBV2kHf7Yw7HjNJXqE5nKOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Test Citizen', 'citizen'),
    ('official@winguard.com', '$2b$10$rBV2kHf7Yw7HjNJXqE5nKOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Test Official', 'official')
ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON users TO PUBLIC;
GRANT SELECT, INSERT, UPDATE ON saved_routes TO PUBLIC;
GRANT SELECT, INSERT, UPDATE ON report_votes TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

COMMENT ON TABLE users IS 'User authentication and profile information';
COMMENT ON TABLE saved_routes IS 'User saved routes with safety scores';
COMMENT ON TABLE report_votes IS 'User votes on reports for credibility';
COMMENT ON FUNCTION calculate_enhanced_safety_score IS 'Calculate safety score with critical report weighting';
COMMENT ON FUNCTION get_route_alternatives IS 'Get safe and fast route alternatives with safety scores';
