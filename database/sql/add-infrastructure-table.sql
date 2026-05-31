-- ============================================
-- Add Infrastructure Table for Safety Scoring
-- ============================================

-- Create infrastructure table if it doesn't exist
CREATE TABLE IF NOT EXISTS infrastructure (
    infra_id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'streetlight', 'police_booth', 'cctv', etc.
    status VARCHAR(50) DEFAULT 'functional', -- 'functional', 'broken', 'under_maintenance'
    location GEOGRAPHY(Point, 4326), -- PostGIS spatial type
    installed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_maintenance TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for performance
CREATE INDEX IF NOT EXISTS idx_infrastructure_location ON infrastructure USING GIST(location);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS idx_infrastructure_type ON infrastructure(type);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_infrastructure_status ON infrastructure(status);

-- Insert sample infrastructure data for Bengaluru areas
-- Koramangala (High crime area - needs more infrastructure)
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.6245 12.9352)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.6255 12.9362)')),
('streetlight', 'broken', ST_GeogFromText('POINT(77.6235 12.9342)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.6250 12.9355)'))
ON CONFLICT DO NOTHING;

-- Indiranagar
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.6412 12.9716)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.6422 12.9726)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.6402 12.9706)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.6415 12.9720)'))
ON CONFLICT DO NOTHING;

-- Jayanagar (Low crime area - good infrastructure)
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.5838 12.9250)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.5848 12.9260)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.5828 12.9240)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.5858 12.9270)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.5840 12.9255)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.5850 12.9265)'))
ON CONFLICT DO NOTHING;

-- Whitefield
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.7499 12.9698)')),
('streetlight', 'broken', ST_GeogFromText('POINT(77.7509 12.9708)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.7505 12.9705)'))
ON CONFLICT DO NOTHING;

-- Electronic City
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.6603 12.8456)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.6613 12.8466)')),
('streetlight', 'broken', ST_GeogFromText('POINT(77.6593 12.8446)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.6608 12.8461)'))
ON CONFLICT DO NOTHING;

-- Malleshwaram
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.5710 13.0039)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.5720 13.0049)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.5700 13.0029)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.5715 13.0044)'))
ON CONFLICT DO NOTHING;

-- BTM Layout
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.6101 12.9165)')),
('streetlight', 'broken', ST_GeogFromText('POINT(77.6111 12.9175)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.6106 12.9170)'))
ON CONFLICT DO NOTHING;

-- Basavanagudi (Low crime - excellent infrastructure)
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.5742 12.9423)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.5752 12.9433)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.5732 12.9413)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.5762 12.9443)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.5747 12.9428)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.5757 12.9438)'))
ON CONFLICT DO NOTHING;

-- JP Nagar
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.5855 12.9081)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.5865 12.9091)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.5860 12.9086)'))
ON CONFLICT DO NOTHING;

-- Rajajinagar
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.5520 12.9916)')),
('streetlight', 'broken', ST_GeogFromText('POINT(77.5530 12.9926)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.5525 12.9921)'))
ON CONFLICT DO NOTHING;

-- Vijayanagar
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.5219 12.9698)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.5229 12.9708)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.5224 12.9703)'))
ON CONFLICT DO NOTHING;

-- Yelahanka
INSERT INTO infrastructure (type, status, location) VALUES
('streetlight', 'functional', ST_GeogFromText('POINT(77.5963 13.1007)')),
('streetlight', 'functional', ST_GeogFromText('POINT(77.5973 13.1017)')),
('police_booth', 'functional', ST_GeogFromText('POINT(77.5968 13.1012)'))
ON CONFLICT DO NOTHING;

-- Verify installation
SELECT 
    type,
    status,
    COUNT(*) as count
FROM infrastructure
GROUP BY type, status
ORDER BY type, status;

SELECT '✅ Infrastructure table created and populated!' AS status;
