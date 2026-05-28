# WinGuard Deployment Checklist

## 📋 Pre-Deployment Checklist

### 1. Database Setup ☐

#### Step 1.1: Backup Existing Database
```bash
# Create backup before migration
pg_dump -U your_username -d your_database > backup_$(date +%Y%m%d).sql
```
- [ ] Database backup created
- [ ] Backup verified and stored safely

#### Step 1.2: Run Comprehensive Enhancements
```sql
-- Connect to database
psql -U your_username -d your_database

-- Run enhancements
\i comprehensive-enhancements.sql
```
- [ ] comprehensive-enhancements.sql executed successfully
- [ ] No errors in execution
- [ ] All tables created (contractors, executive_engineers, crime_analytics, budget_simulations)
- [ ] All functions created (calculate_ai_budget, calculate_crime_impact, auto_assign_engineer)
- [ ] All triggers created (auto_assign_engineer_trigger)
- [ ] All indexes created

#### Step 1.3: Load Global Sample Data
```sql
\i global-sample-data.sql
```
- [ ] global-sample-data.sql executed successfully
- [ ] 60+ reports loaded
- [ ] 18 contractors loaded
- [ ] 18 engineers loaded
- [ ] Sample crime data loaded

#### Step 1.4: Verify Database
```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contractors', 'executive_engineers', 'crime_analytics', 'budget_simulations');

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('calculate_ai_budget', 'calculate_crime_impact', 'auto_assign_engineer');

-- Check data counts
SELECT COUNT(*) FROM reports;  -- Should be 60+
SELECT COUNT(*) FROM contractors;  -- Should be 18
SELECT COUNT(*) FROM executive_engineers;  -- Should be 18
SELECT COUNT(*) FROM crime_analytics;  -- Should have data

-- Check columns added to reports
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN ('road_type', 'road_name', 'last_relaying_date', 'contractor_name', 
                    'estimated_cost', 'amount_sanctioned', 'amount_spent', 'budget_variance',
                    'assigned_engineer_id', 'ward_name', 'city', 'country');
```
- [ ] All tables exist
- [ ] All functions exist
- [ ] Data counts correct
- [ ] All columns added to reports table

---

### 2. Backend Setup ☐

#### Step 2.1: Copy New Route Files
```bash
# Ensure these files exist in server/src/routes/
ls -la server/src/routes/engineerRoutes.ts
ls -la server/src/routes/reportsEnhanced.ts
```
- [ ] engineerRoutes.ts exists
- [ ] reportsEnhanced.ts exists

#### Step 2.2: Update Server Entry Point
In `server/src/index.ts` or `server/src/app.ts`:

```typescript
// Add imports
import engineerRoutes from './routes/engineerRoutes';
import reportsEnhanced from './routes/reportsEnhanced';

// Add routes (after other route declarations)
app.use('/api', engineerRoutes);
app.use('/api/reports', reportsEnhanced);
```
- [ ] Imports added
- [ ] Routes registered
- [ ] No TypeScript errors

#### Step 2.3: Verify Modified Files
```bash
# Check if files were modified
git diff server/src/routes/budgetRoutes.ts
git diff server/src/routes/simulationRoutes.ts
```
- [ ] budgetRoutes.ts has new endpoints
- [ ] simulationRoutes.ts has new endpoints

#### Step 2.4: Install Dependencies (if needed)
```bash
cd server
npm install
# or
yarn install
```
- [ ] Dependencies installed
- [ ] No installation errors

#### Step 2.5: Build TypeScript
```bash
npm run build
# or
yarn build
```
- [ ] TypeScript compiled successfully
- [ ] No compilation errors

---

### 3. Frontend Setup ☐

#### Step 3.1: Verify Modified Files
```bash
# Check if files were modified
git diff apps/official-dashboard/src/pages/ReportsPage.tsx
git diff apps/official-dashboard/src/pages/SimulationsPage.tsx
```
- [ ] ReportsPage.tsx has filtering fixes
- [ ] SimulationsPage.tsx has budget/crime analytics

#### Step 3.2: Install Dependencies (if needed)
```bash
cd apps/official-dashboard
npm install
# or
yarn install
```
- [ ] Dependencies installed
- [ ] No installation errors

#### Step 3.3: Build Frontend
```bash
npm run build
# or
yarn build
```
- [ ] Frontend built successfully
- [ ] No build errors

---

### 4. Testing ☐

#### Step 4.1: Start Server
```bash
cd server
npm run dev
# or
yarn dev
```
- [ ] Server started without errors
- [ ] No console errors
- [ ] Server listening on correct port

#### Step 4.2: Test API Endpoints

**Budget Endpoints:**
```bash
curl http://localhost:3000/api/budget/issues
curl http://localhost:3000/api/budget/analytics
```
- [ ] /api/budget/issues returns data
- [ ] /api/budget/analytics returns data

**Engineer Endpoints:**
```bash
curl http://localhost:3000/api/engineers
curl http://localhost:3000/api/engineers/1
```
- [ ] /api/engineers returns 18 engineers
- [ ] /api/engineers/:id returns engineer details

**Enhanced Reports Endpoints:**
```bash
curl http://localhost:3000/api/reports/enhanced
curl http://localhost:3000/api/reports/stats
curl http://localhost:3000/api/reports/dashboard
```
- [ ] /api/reports/enhanced returns filtered data
- [ ] /api/reports/stats returns statistics
- [ ] /api/reports/dashboard returns map data

**Simulation Endpoints:**
```bash
# Create simulation first, then test with simulation_id
curl -X POST http://localhost:3000/api/simulations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test","center_lat":12.9716,"center_lng":77.5946}'
```
- [ ] Can create simulation
- [ ] Can calculate budget (POST /api/simulations/:id/calculate-budget)
- [ ] Can calculate crime impact (POST /api/simulations/:id/calculate-crime-impact)

#### Step 4.3: Test Frontend

**Start Frontend:**
```bash
cd apps/official-dashboard
npm run dev
# or
yarn dev
```
- [ ] Frontend started without errors
- [ ] No console errors in browser

**Test Reports Page:**
- [ ] Navigate to /reports
- [ ] Click "All Reports" filter - shows all reports
- [ ] Click "Pending" filter - shows only pending reports
- [ ] Click "In Progress" filter - shows only in-progress reports
- [ ] Click "Resolved" filter - shows only resolved reports
- [ ] Count updates correctly for each filter

**Test Simulations Page:**
- [ ] Navigate to /simulations
- [ ] Click "Create Simulation" - simulation created
- [ ] Add infrastructure (police booth, streetlight, pothole fix)
- [ ] Click "Calculate Impact" - shows impact analysis
- [ ] Budget tracker card appears (if potholes added)
- [ ] Crime analytics card appears (if streetlights/police booths added)
- [ ] Can expand/collapse cost factors
- [ ] Can expand/collapse crime details
- [ ] Confidence scores display correctly
- [ ] Recommendations show

#### Step 4.4: Test Database Triggers

**Test Auto-Assignment:**
```sql
-- Insert a test report
INSERT INTO reports (
  category, severity, description, location, 
  ward_name, city, country
) VALUES (
  'Pothole', 8, 'Test pothole', 
  ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography,
  'Koramangala', 'Bangalore', 'India'
) RETURNING report_id, assigned_engineer_id;

-- Check if engineer was auto-assigned
SELECT r.report_id, r.assigned_engineer_id, ee.engineer_name
FROM reports r
LEFT JOIN executive_engineers ee ON r.assigned_engineer_id = ee.engineer_id
WHERE r.report_id = [insert_report_id_here];
```
- [ ] Engineer auto-assigned on report creation
- [ ] Correct engineer assigned based on jurisdiction
- [ ] Engineer workload incremented

#### Step 4.5: Test AI Functions

**Test AI Budget Calculation:**
```sql
SELECT * FROM calculate_ai_budget(
  'Pothole',  -- issue_type
  50000,      -- base_cost
  12.9716,    -- latitude
  77.5946,    -- longitude
  'NH'        -- road_type
);
```
- [ ] Function returns estimated_cost
- [ ] Function returns ai_predicted_cost
- [ ] Function returns confidence_score (75-95)
- [ ] Function returns cost_factors JSON

**Test Crime Impact Calculation:**
```sql
SELECT * FROM calculate_crime_impact(
  12.9716,    -- latitude
  77.5946,    -- longitude
  1000,       -- radius_meters
  5,          -- new_streetlights
  2           -- new_police_booths
);
```
- [ ] Function returns crime_incidents_before
- [ ] Function returns crime_incidents_after
- [ ] Function returns predicted_reduction
- [ ] Reduction percentage is reasonable (0-70%)

---

### 5. Data Verification ☐

#### Step 5.1: Verify Global Data Distribution
```sql
-- Check country distribution
SELECT country, COUNT(*) as count 
FROM reports 
WHERE country IS NOT NULL 
GROUP BY country 
ORDER BY count DESC;

-- Should show 25+ countries
```
- [ ] Reports distributed across 25+ countries
- [ ] Major cities represented (New York, London, Tokyo, etc.)

#### Step 5.2: Verify Road Information
```sql
-- Check road types
SELECT road_type, COUNT(*) as count 
FROM reports 
WHERE road_type IS NOT NULL 
GROUP BY road_type;

-- Should show NH, SH, MDR, etc.
```
- [ ] Road types populated (NH, SH, MDR, ODR, VR)
- [ ] Road names populated
- [ ] Last relaying dates populated

#### Step 5.3: Verify Contractor Assignment
```sql
-- Check contractor assignments
SELECT contractor_name, COUNT(*) as count 
FROM reports 
WHERE contractor_name IS NOT NULL 
GROUP BY contractor_name;
```
- [ ] Contractors assigned to reports
- [ ] Multiple contractors represented

#### Step 5.4: Verify Engineer Assignment
```sql
-- Check engineer assignments
SELECT ee.engineer_name, COUNT(r.report_id) as assigned_count
FROM executive_engineers ee
LEFT JOIN reports r ON ee.engineer_id = r.assigned_engineer_id
GROUP BY ee.engineer_name
ORDER BY assigned_count DESC;
```
- [ ] Engineers have assigned reports
- [ ] Workload distributed across engineers

---

### 6. Performance Testing ☐

#### Step 6.1: Test Query Performance
```sql
-- Test enhanced reports query
EXPLAIN ANALYZE
SELECT * FROM reports 
WHERE status = 'In Progress' 
AND city = 'Bangalore' 
AND road_type = 'NH'
LIMIT 50;

-- Should use indexes and complete in <300ms
```
- [ ] Query uses indexes
- [ ] Query completes in <300ms
- [ ] No sequential scans on large tables

#### Step 6.2: Test API Response Times
Use browser DevTools Network tab or curl with timing:
```bash
time curl http://localhost:3000/api/budget/analytics
time curl http://localhost:3000/api/reports/enhanced
time curl http://localhost:3000/api/engineers
```
- [ ] Budget analytics: <200ms
- [ ] Enhanced reports: <300ms
- [ ] Engineers list: <150ms

---

### 7. Security Verification ☐

#### Step 7.1: Check SQL Injection Protection
- [ ] All queries use parameterized statements
- [ ] No string concatenation in SQL queries
- [ ] Input validation on all endpoints

#### Step 7.2: Check Authentication
- [ ] Sensitive endpoints require authentication
- [ ] JWT tokens validated correctly
- [ ] Role-based access control working

#### Step 7.3: Check Data Validation
- [ ] Latitude/longitude validated (-90 to 90, -180 to 180)
- [ ] Severity validated (1-10)
- [ ] Road type validated (NH, SH, MDR, ODR, VR)
- [ ] Status validated (Report Received, In Progress, Resolved)

---

### 8. Documentation ☐

#### Step 8.1: Verify Documentation Files
- [ ] IMPLEMENTATION_GUIDE.md exists and is complete
- [ ] CHANGES_SUMMARY.md exists and is complete
- [ ] QUICK_START.md exists and is complete
- [ ] FINAL_IMPLEMENTATION_SUMMARY.md exists and is complete
- [ ] DEPLOYMENT_CHECKLIST.md (this file) exists

#### Step 8.2: Update README (if needed)
- [ ] README updated with new features
- [ ] API documentation updated
- [ ] Setup instructions updated

---

### 9. Production Deployment ☐

#### Step 9.1: Environment Configuration
- [ ] Production database connection configured
- [ ] Environment variables set
- [ ] API keys configured (if any)
- [ ] CORS settings configured

#### Step 9.2: Database Migration on Production
```bash
# On production server
psql -U prod_user -d prod_database < comprehensive-enhancements.sql
psql -U prod_user -d prod_database < global-sample-data.sql
```
- [ ] Production database migrated
- [ ] Sample data loaded (or real data migrated)
- [ ] No errors in production migration

#### Step 9.3: Deploy Backend
```bash
# Build and deploy
npm run build
pm2 start dist/index.js --name winguard-api
# or your deployment method
```
- [ ] Backend deployed to production
- [ ] Server running without errors
- [ ] Health check endpoint responding

#### Step 9.4: Deploy Frontend
```bash
# Build and deploy
npm run build
# Deploy dist folder to hosting
```
- [ ] Frontend deployed to production
- [ ] Assets loading correctly
- [ ] No console errors

#### Step 9.5: Verify Production
- [ ] Production API endpoints responding
- [ ] Production frontend loading
- [ ] Database queries working
- [ ] No errors in production logs

---

### 10. Post-Deployment ☐

#### Step 10.1: Monitor Logs
- [ ] Check server logs for errors
- [ ] Check database logs for slow queries
- [ ] Check frontend console for errors

#### Step 10.2: Performance Monitoring
- [ ] API response times acceptable
- [ ] Database query times acceptable
- [ ] Frontend load times acceptable

#### Step 10.3: User Acceptance Testing
- [ ] City officials can view global issues
- [ ] Budget tracking works end-to-end
- [ ] AI predictions display correctly
- [ ] Crime analytics display correctly
- [ ] Engineer routing works
- [ ] Report filtering works

#### Step 10.4: Backup Strategy
- [ ] Automated backups configured
- [ ] Backup restoration tested
- [ ] Backup retention policy set

---

## 🎉 Deployment Complete!

Once all items are checked, your WinGuard platform is fully deployed with:
- ✅ Budget tracking and AI predictions
- ✅ Crime analytics
- ✅ Global sample data
- ✅ Engineer routing
- ✅ Enhanced filtering
- ✅ Road information tracking

---

## 📞 Support

If you encounter issues during deployment:
1. Check the IMPLEMENTATION_GUIDE.md for detailed instructions
2. Review database logs for migration errors
3. Check API endpoint responses
4. Verify all files were copied correctly
5. Ensure all dependencies are installed

---

## 🔄 Rollback Plan

If deployment fails:

### Database Rollback
```bash
# Restore from backup
psql -U your_username -d your_database < backup_YYYYMMDD.sql
```

### Code Rollback
```bash
# Revert to previous commit
git revert HEAD
# or
git reset --hard [previous_commit_hash]
```

### Server Rollback
```bash
# Stop new version
pm2 stop winguard-api

# Start previous version
pm2 start previous_version
```

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Production URL:** _________________
**Status:** ☐ In Progress  ☐ Complete  ☐ Failed

---

**Good luck with your deployment! 🚀**
