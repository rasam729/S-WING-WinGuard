-- ============================================
-- WinGuard Cloud PostgreSQL Initialization
-- ============================================
-- Run this script in your cloud PostgreSQL SQL editor
-- (Neon, Supabase, Railway, or Render)
--
-- This script will:
-- 1. Enable PostGIS extension
-- 2. Create all required tables
-- 3. Create views and functions
-- 4. Insert initial department data
-- 5. Create triggers for automatic report triage
-- ============================================

-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS installation
SELECT PostGIS_Version();

-- ============================================
-- Create Tables
-- ============================================

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    executive_engineer VARCHAR(100),
    contact_email VARCHAR(100)
);

-- Reports table with PostGIS spatial column
CREATE TABLE IF NOT EXISTS reports (
    report_id SERIAL PRIMARY KEY,
    category TEXT,
    severity INTEGER,
    description TEXT,
    report_status TEXT DEFAULT 'Received',
    location GEOGRAPHY(Point, 4326),  -- PostGIS spatial type (lat/lng)
    dept_id INTEGER REFERENCES departments(dept_id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Report Received',
    amount_sanctioned NUMERIC(12,2) DEFAULT 0.00,
    amount_spent NUMERIC(12,2) DEFAULT 0.00
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    budget_id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(report_id),
    sanctioned_amount NUMERIC(12,2),
    spent_amount NUMERIC(12,2),
    funding_source TEXT
);

-- ============================================
-- Create Indexes for Performance
-- ============================================

-- Spatial index on location column (critical for performance)
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST(location);

-- Index on category for filtering
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);

-- Index on status for dashboard queries
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Index on dept_id for department filtering
CREATE INDEX IF NOT EXISTS idx_reports_dept_id ON reports(dept_id);

-- Index on report_id in budgets table
CREATE INDEX IF NOT EXISTS idx_budgets_report_id ON budgets(report_id);

-- ============================================
-- Create View for Dashboard
-- ============================================

-- Drop view if exists (for re-running script)
DROP VIEW IF EXISTS map_dashboard_data;

-- Create view that extracts lat/lng from PostGIS geography
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
    description
FROM reports;

-- ============================================
-- Create Trigger Function for Auto-Triage
-- ============================================

-- Drop function if exists (for re-running script)
DROP FUNCTION IF EXISTS triage_report() CASCADE;

-- Function to automatically assign reports to departments
CREATE OR REPLACE FUNCTION triage_report() 
RETURNS TRIGGER AS $$
BEGIN
    -- Assign to Public Works Department for potholes
    IF NEW.category = 'Pothole' THEN
        NEW.dept_id := (
            SELECT dept_id 
            FROM departments 
            WHERE dept_name = 'Public Works Department'
        );
    -- Assign to Electrical & Lighting for streetlight issues
    ELSIF NEW.category IN ('Streetlight', 'Dark Alley') THEN
        NEW.dept_id := (
            SELECT dept_id 
            FROM departments 
            WHERE dept_name = 'Electrical & Lighting'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires before insert
DROP TRIGGER IF EXISTS trigger_triage ON reports;

CREATE TRIGGER trigger_triage
    BEFORE INSERT ON reports
    FOR EACH ROW
    EXECUTE FUNCTION triage_report();

-- ============================================
-- Insert Initial Department Data
-- ============================================

-- Clear existing departments (optional - comment out if you want to keep existing data)
-- TRUNCATE departments CASCADE;

-- Insert departments (use ON CONFLICT to avoid duplicates)
INSERT INTO departments (dept_id, dept_name, executive_engineer, contact_email)
VALUES 
    (1, 'Public Works Department', 'Er. Rajesh Kumar', 'rajesh.kumar@winguard.gov'),
    (2, 'Electrical & Lighting', 'Er. Sneha Rao', 'sneha.rao@winguard.gov')
ON CONFLICT (dept_id) DO NOTHING;

-- Reset sequence to continue from 3
SELECT setval('departments_dept_id_seq', (SELECT MAX(dept_id) FROM departments));

-- ============================================
-- Insert Sample Data (Optional - for testing)
-- ============================================

-- Uncomment below to insert sample reports for testing

/*
-- Sample report 1: Pothole in New York
INSERT INTO reports (category, severity, description, location)
VALUES (
    'Pothole',
    8,
    'Large pothole on Main Street causing traffic issues',
    ST_GeogFromText('POINT(-74.0060 40.7128)')  -- NYC coordinates
);

-- Sample report 2: Broken streetlight
INSERT INTO reports (category, severity, description, location)
VALUES (
    'Streetlight',
    6,
    'Streetlight not working on Park Avenue',
    ST_GeogFromText('POINT(-73.9712 40.7831)')  -- Upper East Side
);

-- Sample report 3: Dark alley
INSERT INTO reports (category, severity, description, location)
VALUES (
    'Dark Alley',
    9,
    'Completely dark alley with no lighting',
    ST_GeogFromText('POINT(-73.9442 40.6782)')  -- Brooklyn
);
*/

-- ============================================
-- Verify Installation
-- ============================================

-- Check tables created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('reports', 'budgets', 'departments')
ORDER BY table_name;

-- Check PostGIS is working
SELECT 
    'PostGIS is working!' AS message,
    PostGIS_Version() AS version;

-- Check departments inserted
SELECT * FROM departments;

-- Check view is working
SELECT 
    'View created successfully!' AS message,
    COUNT(*) AS report_count
FROM map_dashboard_data;

-- ============================================
-- Useful Queries for Testing
-- ============================================

-- Query 1: Get all reports with lat/lng
-- SELECT report_id, category, status, longitude, latitude FROM map_dashboard_data;

-- Query 2: Find reports within 5km of a point
-- SELECT 
--     report_id, 
--     category,
--     ST_Distance(location, ST_GeogFromText('POINT(-74.0060 40.7128)')) / 1000 AS distance_km
-- FROM reports
-- WHERE ST_DWithin(location, ST_GeogFromText('POINT(-74.0060 40.7128)'), 5000)
-- ORDER BY distance_km;

-- Query 3: Count reports by category
-- SELECT category, COUNT(*) as count FROM reports GROUP BY category;

-- Query 4: Get reports with department info
-- SELECT 
--     r.report_id,
--     r.category,
--     r.status,
--     d.dept_name,
--     d.executive_engineer
-- FROM reports r
-- LEFT JOIN departments d ON r.dept_id = d.dept_id;

-- ============================================
-- Success Message
-- ============================================

SELECT 
    '✅ Database initialized successfully!' AS status,
    'You can now connect your WinGuard backend to this database.' AS message;
