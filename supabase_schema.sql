-- =====================================================
-- Bengaluru Road Reporter - Database Schema
-- =====================================================
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create the road_reports table
CREATE TABLE IF NOT EXISTS road_reports (
  -- Primary key
  id BIGSERIAL PRIMARY KEY,
  
  -- Issue details
  issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN (
    'pothole', 
    'road_crack', 
    'streetlight', 
    'illegal_parking', 
    'waterlogging', 
    'other'
  )),
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT,
  keywords TEXT[],
  
  -- Location data (legacy decimal format)
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  
  -- Location data (PostGIS geometry - POINT with SRID 4326 for WGS84)
  geom GEOMETRY(Point, 4326),
  
  -- Location metadata
  location_name VARCHAR(255),
  
  -- Media
  image_url TEXT,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- User tracking (optional - for future auth integration)
  user_id UUID,
  assigned_to UUID
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_road_reports_issue_type ON road_reports(issue_type);
CREATE INDEX IF NOT EXISTS idx_road_reports_status ON road_reports(status);
CREATE INDEX IF NOT EXISTS idx_road_reports_created_at ON road_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_road_reports_geom ON road_reports USING GIST(geom);

-- Create a trigger to automatically update geom from lat/lng
CREATE OR REPLACE FUNCTION update_geom_from_lat_lng()
RETURNS TRIGGER AS $$
BEGIN
  -- If lat and lng are provided, create/update the PostGIS geometry
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the table
DROP TRIGGER IF EXISTS trigger_update_geom ON road_reports;
CREATE TRIGGER trigger_update_geom
  BEFORE INSERT OR UPDATE ON road_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_geom_from_lat_lng();

-- Create a function to get reports within a radius (in meters)
CREATE OR REPLACE FUNCTION get_reports_near_location(
  center_lat DECIMAL,
  center_lng DECIMAL,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  id BIGINT,
  issue_type VARCHAR,
  description TEXT,
  lat DECIMAL,
  lng DECIMAL,
  distance_meters DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.issue_type,
    r.description,
    r.lat,
    r.lng,
    ST_Distance(
      r.geom::geography,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
    ) AS distance_meters,
    r.created_at
  FROM road_reports r
  WHERE r.geom IS NOT NULL
    AND ST_DWithin(
      r.geom::geography,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (Bengaluru locations)
INSERT INTO road_reports (issue_type, description, lat, lng, location_name, status, keywords) VALUES
  ('pothole', 'Large pothole causing traffic issues', 12.9716, 77.5946, 'MG Road', 'pending', ARRAY['damaged', 'traffic', 'urgent']),
  ('streetlight', 'Broken streetlight near junction', 12.9352, 77.6245, 'Koramangala', 'pending', ARRAY['lighting', 'safety']),
  ('road_crack', 'Multiple cracks on main road', 12.9784, 77.6408, 'Indiranagar', 'in_progress', ARRAY['maintenance', 'road']),
  ('illegal_parking', 'Vehicles blocking road', 12.9698, 77.7500, 'Whitefield', 'pending', ARRAY['parking', 'obstruction']),
  ('waterlogging', 'Water accumulation after rain', 12.9299, 77.5832, 'Jayanagar', 'resolved', ARRAY['drainage', 'flood'])
ON CONFLICT DO NOTHING;

-- Create a view for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  COUNT(*) AS total_reports,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_reports,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_reports,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_reports,
  COUNT(*) FILTER (WHERE issue_type = 'pothole') AS pothole_count,
  COUNT(*) FILTER (WHERE issue_type = 'streetlight') AS streetlight_count,
  COUNT(*) FILTER (WHERE issue_type = 'road_crack') AS road_crack_count,
  COUNT(*) FILTER (WHERE issue_type = 'illegal_parking') AS parking_count,
  COUNT(*) FILTER (WHERE issue_type = 'waterlogging') AS waterlogging_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS reports_last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS reports_last_7d
FROM road_reports;

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE road_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for dashboard)
CREATE POLICY "Allow public read access" ON road_reports
  FOR SELECT
  USING (true);

-- Policy: Allow public insert (for citizen reports)
CREATE POLICY "Allow public insert" ON road_reports
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow authenticated users to update their own reports
-- (Uncomment when you add authentication)
-- CREATE POLICY "Allow users to update own reports" ON road_reports
--   FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if PostGIS is enabled
SELECT PostGIS_Version();

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'road_reports'
ORDER BY ordinal_position;

-- Check sample data
SELECT id, issue_type, location_name, lat, lng, 
       ST_AsText(geom) as geometry_wkt,
       created_at
FROM road_reports
ORDER BY created_at DESC
LIMIT 5;

-- Check dashboard stats
SELECT * FROM dashboard_stats;

-- Test proximity search (reports within 5km of MG Road)
SELECT * FROM get_reports_near_location(12.9716, 77.5946, 5000);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '📊 Sample data inserted';
  RAISE NOTICE '🗺️ PostGIS enabled for geospatial queries';
  RAISE NOTICE '🔒 Row Level Security configured';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your database is ready for the Road Reporter app!';
END $$;
