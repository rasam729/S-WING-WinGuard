-- ============================================
-- WinGuard Digital Twin & Simulation Enhancements
-- Run this in Neon SQL Editor after init-cloud-db.sql
-- ============================================

-- Add simulation-related columns to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS estimated_fix_date DATE,
ADD COLUMN IF NOT EXISTS actual_fix_date DATE,
ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS simulation_id INTEGER;

-- Create simulations table for Digital Twin
CREATE TABLE IF NOT EXISTS simulations (
    simulation_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 5000,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    safety_score_before DECIMAL(5, 2),
    safety_score_after DECIMAL(5, 2),
    crime_rate_before DECIMAL(5, 2),
    crime_rate_after DECIMAL(5, 2)
);

-- Create infrastructure table for police booths, streetlights, etc.
CREATE TABLE IF NOT EXISTS infrastructure (
    infrastructure_id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'police_booth', 'streetlight', 'cctv'
    location GEOGRAPHY(Point, 4326) NOT NULL,
    status VARCHAR(50) DEFAULT 'functional', -- 'functional', 'broken', 'under_maintenance'
    is_simulated BOOLEAN DEFAULT FALSE,
    simulation_id INTEGER REFERENCES simulations(simulation_id),
    installed_date DATE,
    last_maintenance DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create safety_scores table for tracking area safety over time
CREATE TABLE IF NOT EXISTS safety_scores (
    score_id SERIAL PRIMARY KEY,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    radius_meters INTEGER DEFAULT 1000,
    safety_score DECIMAL(5, 2) NOT NULL, -- 0-100
    crime_rate DECIMAL(5, 2), -- incidents per 1000 people
    streetlight_density DECIMAL(5, 2), -- per sq km
    police_booth_density DECIMAL(5, 2), -- per sq km
    pothole_count INTEGER DEFAULT 0,
    calculated_at TIMESTAMP DEFAULT NOW(),
    is_simulated BOOLEAN DEFAULT FALSE,
    simulation_id INTEGER REFERENCES simulations(simulation_id)
);

-- Create notifications table for citizen alerts
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(report_id),
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'success'
    sent_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- Create analytics_events table for tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    event_id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_infrastructure_location ON infrastructure USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_infrastructure_type ON infrastructure(type);
CREATE INDEX IF NOT EXISTS idx_infrastructure_simulation ON infrastructure(simulation_id);
CREATE INDEX IF NOT EXISTS idx_safety_scores_location ON safety_scores USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_reports_simulation ON reports(simulation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_report ON notifications(report_id);

-- Function to calculate safety score for an area
CREATE OR REPLACE FUNCTION calculate_safety_score(
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_m INTEGER DEFAULT 1000
) RETURNS DECIMAL AS $$
DECLARE
    safety_score DECIMAL(5, 2);
    streetlight_count INTEGER;
    police_booth_count INTEGER;
    pothole_count INTEGER;
    crime_count INTEGER;
    area_sq_km DECIMAL;
BEGIN
    -- Calculate area in square kilometers
    area_sq_km := (3.14159 * radius_m * radius_m) / 1000000.0;
    
    -- Count infrastructure within radius
    SELECT COUNT(*) INTO streetlight_count
    FROM infrastructure
    WHERE type = 'streetlight' 
    AND status = 'functional'
    AND ST_DWithin(
        location,
        ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
        radius_m
    );
    
    SELECT COUNT(*) INTO police_booth_count
    FROM infrastructure
    WHERE type = 'police_booth'
    AND status = 'functional'
    AND ST_DWithin(
        location,
        ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
        radius_m
    );
    
    -- Count issues within radius
    SELECT COUNT(*) INTO pothole_count
    FROM reports
    WHERE category = 'Pothole'
    AND status != 'Resolved'
    AND ST_DWithin(
        location,
        ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
        radius_m
    );
    
    SELECT COUNT(*) INTO crime_count
    FROM reports
    WHERE category = 'Crime'
    AND created_at > NOW() - INTERVAL '30 days'
    AND ST_DWithin(
        location,
        ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
        radius_m
    );
    
    -- Calculate safety score (0-100)
    -- Higher score = safer
    safety_score := 50.0; -- Base score
    
    -- Add points for infrastructure (max +30)
    safety_score := safety_score + LEAST(30, (streetlight_count / area_sq_km) * 2);
    safety_score := safety_score + LEAST(20, (police_booth_count / area_sq_km) * 10);
    
    -- Subtract points for issues (max -50)
    safety_score := safety_score - LEAST(25, (pothole_count / area_sq_km) * 5);
    safety_score := safety_score - LEAST(25, (crime_count / area_sq_km) * 10);
    
    -- Ensure score is between 0 and 100
    safety_score := GREATEST(0, LEAST(100, safety_score));
    
    RETURN safety_score;
END;
$$ LANGUAGE plpgsql;

-- Insert sample infrastructure for Bengaluru (12.9716° N, 77.5946° E)
-- Koramangala area
INSERT INTO infrastructure (type, location, status) VALUES
('police_booth', ST_GeogFromText('POINT(77.5946 12.9716)'), 'functional'),
('police_booth', ST_GeogFromText('POINT(77.6100 12.9350)'), 'functional'),
('streetlight', ST_GeogFromText('POINT(77.5950 12.9720)'), 'functional'),
('streetlight', ST_GeogFromText('POINT(77.5940 12.9710)'), 'functional'),
('streetlight', ST_GeogFromText('POINT(77.5960 12.9730)'), 'broken'),
('streetlight', ST_GeogFromText('POINT(77.6000 12.9400)'), 'functional'),
('streetlight', ST_GeogFromText('POINT(77.6050 12.9380)'), 'functional')
ON CONFLICT DO NOTHING;

-- Create view for map with infrastructure
DROP VIEW IF EXISTS map_dashboard_data;
CREATE VIEW map_dashboard_data AS
SELECT 
    report_id,
    category,
    status,
    amount_sanctioned,
    ST_X(location::geometry) AS longitude,
    ST_Y(location::geometry) AS latitude,
    created_at,
    severity,
    description,
    estimated_fix_date,
    actual_fix_date,
    is_simulated
FROM reports;

-- Success message
SELECT 
    '✅ Database enhancements applied successfully!' AS status,
    'Digital Twin simulation features are now available.' AS message;
