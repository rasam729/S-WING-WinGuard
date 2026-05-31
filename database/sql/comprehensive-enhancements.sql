-- ============================================
-- WinGuard Comprehensive Enhancements
-- Budget tracking, road info, global data, crime analytics
-- ============================================

-- Add road information and contractor details to reports
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS road_type VARCHAR(20) CHECK (road_type IN ('NH', 'SH', 'MDR', 'ODR', 'VR')),
ADD COLUMN IF NOT EXISTS road_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS last_relaying_date DATE,
ADD COLUMN IF NOT EXISTS contractor_id INTEGER,
ADD COLUMN IF NOT EXISTS contractor_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS ward_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS assigned_engineer_id INTEGER;

-- Add budget tracking columns to reports (if not exists)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS budget_variance NUMERIC(12,2) DEFAULT 0.00;

-- Create contractors table if not exists
CREATE TABLE IF NOT EXISTS contractors (
    contractor_id SERIAL PRIMARY KEY,
    contractor_name VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    license_number VARCHAR(100),
    specialization TEXT[], -- Array of specializations
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_projects INTEGER DEFAULT 0,
    active_projects INTEGER DEFAULT 0,
    city VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create executive_engineers table if not exists
CREATE TABLE IF NOT EXISTS executive_engineers (
    engineer_id SERIAL PRIMARY KEY,
    engineer_name VARCHAR(200) NOT NULL,
    designation VARCHAR(100),
    department VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    office_address TEXT,
    jurisdiction_wards TEXT[], -- Array of ward names
    specialization TEXT[], -- Array of issue categories they handle
    city VARCHAR(100),
    country VARCHAR(100),
    workload INTEGER DEFAULT 0, -- Current number of assigned issues
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE reports 
ADD CONSTRAINT fk_contractor 
FOREIGN KEY (contractor_id) REFERENCES contractors(contractor_id) ON DELETE SET NULL;

ALTER TABLE reports 
ADD CONSTRAINT fk_engineer 
FOREIGN KEY (assigned_engineer_id) REFERENCES executive_engineers(engineer_id) ON DELETE SET NULL;

-- Create crime_analytics table for tracking crime rates
CREATE TABLE IF NOT EXISTS crime_analytics (
    crime_id SERIAL PRIMARY KEY,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    crime_type VARCHAR(100),
    crime_category VARCHAR(50), -- 'violent', 'property', 'traffic', 'other'
    severity INTEGER CHECK (severity BETWEEN 1 AND 10),
    reported_date TIMESTAMP DEFAULT NOW(),
    resolved_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'reported',
    ward_name VARCHAR(100),
    city VARCHAR(100),
    country VARCHAR(100),
    police_station VARCHAR(200),
    is_simulated BOOLEAN DEFAULT FALSE,
    simulation_id INTEGER REFERENCES simulations(simulation_id)
);

-- Create budget_simulations table for AI budget predictions
CREATE TABLE IF NOT EXISTS budget_simulations (
    budget_sim_id SERIAL PRIMARY KEY,
    simulation_id INTEGER REFERENCES simulations(simulation_id),
    issue_type VARCHAR(100),
    estimated_cost NUMERIC(12,2),
    ai_predicted_cost NUMERIC(12,2),
    confidence_score DECIMAL(5,2), -- 0-100
    cost_factors JSONB, -- JSON object with cost breakdown
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add crime rate tracking to simulations
ALTER TABLE simulations
ADD COLUMN IF NOT EXISTS crime_incidents_before INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS crime_incidents_after INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS predicted_crime_reduction DECIMAL(5,2) DEFAULT 0.00;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_road_type ON reports(road_type);
CREATE INDEX IF NOT EXISTS idx_reports_contractor ON reports(contractor_id);
CREATE INDEX IF NOT EXISTS idx_reports_engineer ON reports(assigned_engineer_id);
CREATE INDEX IF NOT EXISTS idx_reports_city_country ON reports(city, country);
CREATE INDEX IF NOT EXISTS idx_crime_analytics_location ON crime_analytics USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_crime_analytics_city ON crime_analytics(city, country);
CREATE INDEX IF NOT EXISTS idx_contractors_city ON contractors(city, country);
CREATE INDEX IF NOT EXISTS idx_engineers_city ON executive_engineers(city, country);

-- Function to calculate AI-adjusted budget for simulation
CREATE OR REPLACE FUNCTION calculate_ai_budget(
    issue_type VARCHAR,
    base_cost NUMERIC,
    location_lat DECIMAL,
    location_lng DECIMAL,
    road_type VARCHAR DEFAULT 'MDR'
) RETURNS TABLE(
    estimated_cost NUMERIC,
    ai_predicted_cost NUMERIC,
    confidence_score DECIMAL,
    cost_factors JSONB
) AS $$
DECLARE
    location_multiplier DECIMAL := 1.0;
    road_type_multiplier DECIMAL := 1.0;
    urgency_multiplier DECIMAL := 1.0;
    nearby_issues INTEGER := 0;
BEGIN
    -- Calculate location-based multiplier (urban vs rural)
    -- This is simplified; in production, use actual city data
    location_multiplier := 1.0 + (RANDOM() * 0.3); -- 1.0 to 1.3
    
    -- Road type multiplier
    road_type_multiplier := CASE road_type
        WHEN 'NH' THEN 1.5  -- National Highway - higher quality required
        WHEN 'SH' THEN 1.3  -- State Highway
        WHEN 'MDR' THEN 1.1 -- Major District Road
        WHEN 'ODR' THEN 1.0 -- Other District Road
        WHEN 'VR' THEN 0.8  -- Village Road
        ELSE 1.0
    END;
    
    -- Count nearby issues for bulk discount
    SELECT COUNT(*) INTO nearby_issues
    FROM reports
    WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)::geography,
        1000 -- within 1km
    ) AND status != 'Resolved';
    
    -- Bulk work discount
    IF nearby_issues > 5 THEN
        urgency_multiplier := 0.85; -- 15% discount for bulk work
    ELSIF nearby_issues > 2 THEN
        urgency_multiplier := 0.92; -- 8% discount
    ELSE
        urgency_multiplier := 1.0;
    END IF;
    
    -- Calculate final costs
    estimated_cost := base_cost;
    ai_predicted_cost := base_cost * location_multiplier * road_type_multiplier * urgency_multiplier;
    confidence_score := 75.0 + (RANDOM() * 20.0); -- 75-95% confidence
    
    cost_factors := jsonb_build_object(
        'base_cost', base_cost,
        'location_multiplier', location_multiplier,
        'road_type_multiplier', road_type_multiplier,
        'bulk_discount', urgency_multiplier,
        'nearby_issues', nearby_issues
    );
    
    RETURN QUERY SELECT 
        estimated_cost,
        ai_predicted_cost,
        confidence_score,
        cost_factors;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate crime rate impact of infrastructure changes
CREATE OR REPLACE FUNCTION calculate_crime_impact(
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_m INTEGER DEFAULT 1000,
    new_streetlights INTEGER DEFAULT 0,
    new_police_booths INTEGER DEFAULT 0
) RETURNS TABLE(
    crime_incidents_before INTEGER,
    crime_incidents_after INTEGER,
    predicted_reduction DECIMAL
) AS $$
DECLARE
    current_crimes INTEGER;
    streetlight_impact DECIMAL := 0.15; -- 15% reduction per streetlight cluster
    police_impact DECIMAL := 0.25; -- 25% reduction per police booth
    total_reduction DECIMAL;
BEGIN
    -- Count current crime incidents in area
    SELECT COUNT(*) INTO current_crimes
    FROM crime_analytics
    WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
        radius_m
    ) AND reported_date > NOW() - INTERVAL '6 months';
    
    -- Calculate predicted reduction
    total_reduction := LEAST(
        (new_streetlights * streetlight_impact) + (new_police_booths * police_impact),
        0.70 -- Max 70% reduction
    );
    
    crime_incidents_before := current_crimes;
    crime_incidents_after := GREATEST(
        FLOOR(current_crimes * (1 - total_reduction)),
        0
    );
    predicted_reduction := total_reduction * 100;
    
    RETURN QUERY SELECT 
        crime_incidents_before,
        crime_incidents_after,
        predicted_reduction;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign engineer based on jurisdiction and workload
CREATE OR REPLACE FUNCTION auto_assign_engineer(
    report_ward VARCHAR,
    report_category VARCHAR,
    report_city VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    assigned_engineer_id INTEGER;
BEGIN
    -- Find engineer with matching jurisdiction, specialization, and lowest workload
    SELECT engineer_id INTO assigned_engineer_id
    FROM executive_engineers
    WHERE city = report_city
        AND (report_ward = ANY(jurisdiction_wards) OR jurisdiction_wards IS NULL)
        AND (report_category = ANY(specialization) OR specialization IS NULL)
    ORDER BY workload ASC, engineer_id ASC
    LIMIT 1;
    
    -- Update engineer workload
    IF assigned_engineer_id IS NOT NULL THEN
        UPDATE executive_engineers
        SET workload = workload + 1
        WHERE engineer_id = assigned_engineer_id;
    END IF;
    
    RETURN assigned_engineer_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign engineer when report is created
CREATE OR REPLACE FUNCTION trigger_auto_assign_engineer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_engineer_id IS NULL AND NEW.ward_name IS NOT NULL THEN
        NEW.assigned_engineer_id := auto_assign_engineer(
            NEW.ward_name,
            NEW.category,
            NEW.city
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_assign_engineer_trigger ON reports;
CREATE TRIGGER auto_assign_engineer_trigger
    BEFORE INSERT ON reports
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_assign_engineer();

-- ============================================
-- Insert Global Sample Data
-- ============================================

-- Insert contractors from around the world
INSERT INTO contractors (contractor_name, company_name, contact_phone, contact_email, specialization, rating, city, country) VALUES
-- India
('Rajesh Kumar', 'Kumar Construction Ltd', '+91-9876543210', 'rajesh@kumarconstruction.in', ARRAY['Pothole', 'Road Repair'], 4.5, 'Bangalore', 'India'),
('Priya Sharma', 'Sharma Infrastructure', '+91-9876543211', 'priya@sharmainfra.in', ARRAY['Streetlight', 'Electrical'], 4.7, 'Mumbai', 'India'),
('Amit Patel', 'Patel Roadways', '+91-9876543212', 'amit@patelroadways.in', ARRAY['Pothole', 'Drainage'], 4.3, 'Delhi', 'India'),
-- USA
('John Smith', 'Smith & Sons Construction', '+1-555-0101', 'john@smithconstruction.com', ARRAY['Pothole', 'Road Repair'], 4.6, 'New York', 'USA'),
('Maria Garcia', 'Garcia Infrastructure', '+1-555-0102', 'maria@garciainfra.com', ARRAY['Streetlight', 'Traffic Signal'], 4.8, 'Los Angeles', 'USA'),
('David Johnson', 'Johnson Paving Co', '+1-555-0103', 'david@johnsonpaving.com', ARRAY['Pothole', 'Resurfacing'], 4.4, 'Chicago', 'USA'),
-- UK
('James Wilson', 'Wilson Road Services', '+44-20-7123-4567', 'james@wilsonroads.co.uk', ARRAY['Pothole', 'Road Repair'], 4.5, 'London', 'UK'),
('Emma Thompson', 'Thompson Lighting Ltd', '+44-20-7123-4568', 'emma@thompsonlighting.co.uk', ARRAY['Streetlight'], 4.7, 'Manchester', 'UK'),
-- Germany
('Hans Mueller', 'Mueller Straßenbau', '+49-30-12345678', 'hans@muellerstrasse.de', ARRAY['Pothole', 'Road Repair'], 4.6, 'Berlin', 'Germany'),
('Anna Schmidt', 'Schmidt Beleuchtung', '+49-30-12345679', 'anna@schmidtlight.de', ARRAY['Streetlight'], 4.8, 'Munich', 'Germany'),
-- France
('Pierre Dubois', 'Dubois Travaux', '+33-1-23-45-67-89', 'pierre@duboistravaux.fr', ARRAY['Pothole', 'Road Repair'], 4.4, 'Paris', 'France'),
-- Japan
('Takeshi Yamamoto', 'Yamamoto Construction', '+81-3-1234-5678', 'takeshi@yamamotoconst.jp', ARRAY['Pothole', 'Road Repair'], 4.9, 'Tokyo', 'Japan'),
-- China
('Li Wei', 'Wei Infrastructure', '+86-10-1234-5678', 'liwei@weiinfra.cn', ARRAY['Pothole', 'Road Repair'], 4.5, 'Beijing', 'China'),
-- Brazil
('Carlos Silva', 'Silva Construções', '+55-11-98765-4321', 'carlos@silvaconstrucoes.br', ARRAY['Pothole', 'Road Repair'], 4.3, 'São Paulo', 'Brazil'),
-- South Africa
('Thabo Mbeki', 'Mbeki Roads', '+27-11-123-4567', 'thabo@mbekiroads.co.za', ARRAY['Pothole', 'Road Repair'], 4.4, 'Johannesburg', 'South Africa'),
-- Australia
('Jack Anderson', 'Anderson Infrastructure', '+61-2-9876-5432', 'jack@andersoninfra.com.au', ARRAY['Pothole', 'Road Repair'], 4.7, 'Sydney', 'Australia'),
-- Russia
('Dmitri Ivanov', 'Ivanov Construction', '+7-495-123-4567', 'dmitri@ivanovconstruct.ru', ARRAY['Pothole', 'Road Repair'], 4.2, 'Moscow', 'Russia'),
-- UAE
('Ahmed Al-Rashid', 'Al-Rashid Infrastructure', '+971-4-123-4567', 'ahmed@alrashidinfra.ae', ARRAY['Pothole', 'Road Repair', 'Streetlight'], 4.8, 'Dubai', 'UAE');

-- Insert executive engineers from around the world
INSERT INTO executive_engineers (engineer_name, designation, department, contact_phone, contact_email, office_address, jurisdiction_wards, specialization, city, country) VALUES
-- India
('Dr. Suresh Reddy', 'Executive Engineer', 'PWD Karnataka', '+91-80-22345678', 'suresh.reddy@pwd.kar.gov.in', 'PWD Office, Bangalore', ARRAY['Koramangala', 'Indiranagar', 'HSR Layout'], ARRAY['Pothole', 'Road Repair', 'Drainage'], 'Bangalore', 'India'),
('Eng. Meera Nair', 'Assistant Executive Engineer', 'PWD Karnataka', '+91-80-22345679', 'meera.nair@pwd.kar.gov.in', 'PWD Office, Bangalore', ARRAY['Whitefield', 'Marathahalli', 'Bellandur'], ARRAY['Streetlight', 'Traffic Signal'], 'Bangalore', 'India'),
('Eng. Vikram Singh', 'Executive Engineer', 'PWD Maharashtra', '+91-22-23456789', 'vikram.singh@pwd.mh.gov.in', 'PWD Office, Mumbai', ARRAY['Andheri', 'Bandra', 'Juhu'], ARRAY['Pothole', 'Road Repair'], 'Mumbai', 'India'),
('Eng. Anjali Desai', 'Executive Engineer', 'PWD Delhi', '+91-11-23456789', 'anjali.desai@pwd.delhi.gov.in', 'PWD Office, Delhi', ARRAY['Connaught Place', 'Karol Bagh', 'Dwarka'], ARRAY['Pothole', 'Streetlight'], 'Delhi', 'India'),
-- USA
('Robert Martinez', 'Chief Engineer', 'NYC DOT', '+1-212-639-9675', 'robert.martinez@dot.nyc.gov', 'NYC DOT, 55 Water St', ARRAY['Manhattan', 'Brooklyn', 'Queens'], ARRAY['Pothole', 'Road Repair', 'Traffic Signal'], 'New York', 'USA'),
('Jennifer Lee', 'Senior Engineer', 'LA Public Works', '+1-213-485-3711', 'jennifer.lee@lacity.org', 'LA Public Works, 1149 S Broadway', ARRAY['Downtown', 'Hollywood', 'Venice'], ARRAY['Streetlight', 'Traffic Signal'], 'Los Angeles', 'USA'),
('Michael Brown', 'District Engineer', 'Chicago CDOT', '+1-312-744-3600', 'michael.brown@cityofchicago.org', 'CDOT, 30 N LaSalle St', ARRAY['Loop', 'Lincoln Park', 'Hyde Park'], ARRAY['Pothole', 'Road Repair'], 'Chicago', 'USA'),
-- UK
('Oliver Davies', 'Principal Engineer', 'TfL', '+44-343-222-1234', 'oliver.davies@tfl.gov.uk', 'TfL, 55 Broadway', ARRAY['Westminster', 'Camden', 'Islington'], ARRAY['Pothole', 'Road Repair', 'Streetlight'], 'London', 'UK'),
('Sophie Williams', 'Senior Engineer', 'Manchester Highways', '+44-161-234-5678', 'sophie.williams@manchester.gov.uk', 'Town Hall, Manchester', ARRAY['City Centre', 'Salford', 'Trafford'], ARRAY['Pothole', 'Streetlight'], 'Manchester', 'UK'),
-- Germany
('Klaus Becker', 'Oberingenieur', 'Berlin Senatsverwaltung', '+49-30-9025-0', 'klaus.becker@senuvk.berlin.de', 'Am Köllnischen Park 3', ARRAY['Mitte', 'Kreuzberg', 'Prenzlauer Berg'], ARRAY['Pothole', 'Road Repair'], 'Berlin', 'Germany'),
('Sabine Fischer', 'Ingenieurin', 'Munich Baureferat', '+49-89-233-0', 'sabine.fischer@muenchen.de', 'Friedenstraße 40', ARRAY['Altstadt', 'Schwabing', 'Haidhausen'], ARRAY['Streetlight', 'Traffic Signal'], 'Munich', 'Germany'),
-- France
('François Martin', 'Ingénieur en Chef', 'Mairie de Paris', '+33-1-42-76-40-40', 'francois.martin@paris.fr', 'Hôtel de Ville, Paris', ARRAY['1er', '2e', '3e', '4e'], ARRAY['Pothole', 'Road Repair'], 'Paris', 'France'),
-- Japan
('Hiroshi Tanaka', 'Chief Engineer', 'Tokyo Metropolitan Gov', '+81-3-5321-1111', 'hiroshi.tanaka@metro.tokyo.jp', 'Tokyo Metropolitan Building', ARRAY['Shinjuku', 'Shibuya', 'Minato'], ARRAY['Pothole', 'Road Repair', 'Streetlight'], 'Tokyo', 'Japan'),
-- China
('Wang Chen', 'Chief Engineer', 'Beijing Municipal Commission', '+86-10-5512-3456', 'wangchen@beijing.gov.cn', 'Beijing Municipal Building', ARRAY['Chaoyang', 'Haidian', 'Dongcheng'], ARRAY['Pothole', 'Road Repair'], 'Beijing', 'China'),
-- Brazil
('Ricardo Santos', 'Engenheiro Chefe', 'Prefeitura de São Paulo', '+55-11-3113-9000', 'ricardo.santos@prefeitura.sp.gov.br', 'Viaduto do Chá, 15', ARRAY['Centro', 'Pinheiros', 'Vila Mariana'], ARRAY['Pothole', 'Road Repair'], 'São Paulo', 'Brazil'),
-- South Africa
('Sipho Nkosi', 'Chief Engineer', 'City of Johannesburg', '+27-11-407-7000', 'sipho.nkosi@joburg.org.za', 'Metro Centre, Braamfontein', ARRAY['Sandton', 'Rosebank', 'Soweto'], ARRAY['Pothole', 'Road Repair'], 'Johannesburg', 'South Africa'),
-- Australia
('Andrew Wilson', 'Principal Engineer', 'City of Sydney', '+61-2-9265-9333', 'andrew.wilson@cityofsydney.nsw.gov.au', 'Town Hall House, Sydney', ARRAY['CBD', 'Surry Hills', 'Redfern'], ARRAY['Pothole', 'Road Repair', 'Streetlight'], 'Sydney', 'Australia'),
-- Russia
('Sergei Petrov', 'Chief Engineer', 'Moscow City Administration', '+7-495-777-7777', 'sergei.petrov@mos.ru', 'Tverskaya St, 13', ARRAY['Central', 'Northern', 'Western'], ARRAY['Pothole', 'Road Repair'], 'Moscow', 'Russia'),
-- UAE
('Mohammed Al-Maktoum', 'Chief Engineer', 'Dubai Municipality', '+971-4-221-5555', 'mohammed.almaktoum@dm.gov.ae', 'Dubai Municipality HQ', ARRAY['Deira', 'Bur Dubai', 'Jumeirah'], ARRAY['Pothole', 'Road Repair', 'Streetlight'], 'Dubai', 'UAE');

-- Insert sample crime analytics data for various cities
INSERT INTO crime_analytics (location, crime_type, crime_category, severity, ward_name, city, country, police_station, reported_date) VALUES
-- Bangalore, India
(ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography, 'Theft', 'property', 6, 'Koramangala', 'Bangalore', 'India', 'Koramangala Police Station', NOW() - INTERVAL '30 days'),
(ST_SetSRID(ST_MakePoint(77.6408, 12.9719), 4326)::geography, 'Assault', 'violent', 8, 'Indiranagar', 'Bangalore', 'India', 'Indiranagar Police Station', NOW() - INTERVAL '45 days'),
(ST_SetSRID(ST_MakePoint(77.6387, 12.9082), 4326)::geography, 'Vandalism', 'property', 5, 'HSR Layout', 'Bangalore', 'India', 'HSR Police Station', NOW() - INTERVAL '15 days'),
-- New York, USA
(ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography, 'Robbery', 'violent', 9, 'Manhattan', 'New York', 'USA', 'NYPD 1st Precinct', NOW() - INTERVAL '20 days'),
(ST_SetSRID(ST_MakePoint(-73.9442, 40.6782), 4326)::geography, 'Burglary', 'property', 7, 'Brooklyn', 'New York', 'USA', 'NYPD 84th Precinct', NOW() - INTERVAL '35 days'),
-- London, UK
(ST_SetSRID(ST_MakePoint(-0.1276, 51.5074), 4326)::geography, 'Theft', 'property', 6, 'Westminster', 'London', 'UK', 'Westminster Police Station', NOW() - INTERVAL '25 days'),
(ST_SetSRID(ST_MakePoint(-0.1419, 51.5290), 4326)::geography, 'Assault', 'violent', 7, 'Camden', 'London', 'UK', 'Camden Police Station', NOW() - INTERVAL '40 days'),
-- Berlin, Germany
(ST_SetSRID(ST_MakePoint(13.4050, 52.5200), 4326)::geography, 'Vandalism', 'property', 5, 'Mitte', 'Berlin', 'Germany', 'Polizei Mitte', NOW() - INTERVAL '18 days'),
-- Paris, France
(ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326)::geography, 'Theft', 'property', 6, '1er', 'Paris', 'France', 'Commissariat 1er', NOW() - INTERVAL '22 days'),
-- Tokyo, Japan
(ST_SetSRID(ST_MakePoint(139.6917, 35.6895), 4326)::geography, 'Theft', 'property', 4, 'Shinjuku', 'Tokyo', 'Japan', 'Shinjuku Police Station', NOW() - INTERVAL '28 days'),
-- Sydney, Australia
(ST_SetSRID(ST_MakePoint(151.2093, -33.8688), 4326)::geography, 'Assault', 'violent', 7, 'CBD', 'Sydney', 'Australia', 'Sydney City Police', NOW() - INTERVAL '32 days'),
-- Moscow, Russia
(ST_SetSRID(ST_MakePoint(37.6173, 55.7558), 4326)::geography, 'Theft', 'property', 6, 'Central', 'Moscow', 'Russia', 'Central Police Station', NOW() - INTERVAL '26 days');

COMMENT ON TABLE contractors IS 'Global contractors for road maintenance and repairs';
COMMENT ON TABLE executive_engineers IS 'Executive engineers responsible for issue resolution and routing';
COMMENT ON TABLE crime_analytics IS 'Crime data for safety analytics and simulation impact';
COMMENT ON TABLE budget_simulations IS 'AI-powered budget predictions for simulations';
COMMENT ON FUNCTION calculate_ai_budget IS 'Calculate AI-adjusted budget estimates with confidence scores';
COMMENT ON FUNCTION calculate_crime_impact IS 'Predict crime rate reduction from infrastructure improvements';
COMMENT ON FUNCTION auto_assign_engineer IS 'Automatically assign engineer based on jurisdiction and workload';
