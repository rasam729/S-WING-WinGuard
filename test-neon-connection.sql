-- Quick test script to verify Neon database setup
-- Run this in Neon SQL Editor to check if everything is configured

-- 1. Check PostGIS extension
SELECT 'PostGIS Extension' as test, PostGIS_Version() as result;

-- 2. Check if tables exist
SELECT 'Tables Exist' as test, 
       string_agg(table_name, ', ') as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('reports', 'budgets', 'departments');

-- 3. Check if view exists
SELECT 'View Exists' as test,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.views 
         WHERE table_name = 'map_dashboard_data'
       ) THEN 'Yes' ELSE 'No - Run init-cloud-db.sql!' END as result;

-- 4. Check departments data
SELECT 'Departments Count' as test, 
       COUNT(*)::text as result 
FROM departments;

-- 5. Check reports count
SELECT 'Reports Count' as test,
       COUNT(*)::text as result
FROM reports;

-- If all tests pass, your database is ready!
-- If any test fails, run init-cloud-db.sql in Neon SQL Editor
