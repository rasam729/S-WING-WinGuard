# WinGuard Enhancements - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Run Database Migrations (2 minutes)

```bash
# Connect to your PostgreSQL database
psql -U your_username -d your_database_name

# Or if using Neon/cloud database, open SQL Editor and run:
```

```sql
-- 1. Run comprehensive enhancements (creates tables, functions, triggers)
\i comprehensive-enhancements.sql

-- 2. Load global sample data (60+ reports, 18 contractors, 18 engineers)
\i global-sample-data.sql
```

**What this does:**
- ✅ Adds budget tracking columns to reports
- ✅ Creates contractors, engineers, crime_analytics tables
- ✅ Creates AI budget and crime impact functions
- ✅ Sets up auto-assignment triggers
- ✅ Loads 60+ sample issues from 25+ countries
- ✅ Loads 18 contractors and 18 engineers worldwide

### Step 2: Add New Routes to Server (1 minute)

In `server/src/index.ts` or `server/src/app.ts`:

```typescript
// Add these imports at the top
import engineerRoutes from './routes/engineerRoutes';
import reportsEnhanced from './routes/reportsEnhanced';

// Add these routes with your other routes
app.use('/api', engineerRoutes);
app.use('/api/reports', reportsEnhanced);
```

### Step 3: Restart Server (1 minute)

```bash
cd server
npm run dev
# or
yarn dev
```

### Step 4: Test (1 minute)

Open your browser and test these endpoints:

```
http://localhost:3000/api/budget/analytics
http://localhost:3000/api/engineers
http://localhost:3000/api/reports/enhanced
http://localhost:3000/api/reports/stats
```

## ✅ Verification Checklist

- [ ] Database migrations ran without errors
- [ ] Sample data loaded (check: `SELECT COUNT(*) FROM reports;` should show 60+)
- [ ] Server started without errors
- [ ] API endpoints respond with data
- [ ] Reports page filtering works (All, Pending, In Progress, Resolved)

## 🎯 Key Features Now Available

### 1. Budget Tracking
```javascript
// Sanction budget for an issue
fetch('/api/budget/issues/123/sanction', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount_sanctioned: 50000 })
});

// Get budget analytics
fetch('/api/budget/analytics');
```

### 2. AI Budget Calculation
```javascript
// Calculate AI-adjusted budget
fetch('/api/simulations/1/calculate-budget', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    issue_type: 'Pothole',
    base_cost: 50000,
    latitude: 12.9716,
    longitude: 77.5946,
    road_type: 'NH'
  })
});
```

### 3. Crime Impact Analysis
```javascript
// Calculate crime impact
fetch('/api/simulations/1/calculate-crime-impact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 12.9716,
    longitude: 77.5946,
    radius_meters: 1000,
    new_streetlights: 5,
    new_police_booths: 2
  })
});
```

### 4. Engineer Auto-Assignment
```javascript
// Auto-assign engineer to report
fetch('/api/engineers/auto-assign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ report_id: 123 })
});

// Get engineer contact for report
fetch('/api/engineers/contact/123');
```

### 5. Enhanced Report Filtering
```javascript
// Get filtered reports
fetch('/api/reports/enhanced?status=In Progress&city=Bangalore&road_type=NH');
```

## 📊 Sample Data Overview

### Reports (60+)
- **Countries:** 25+ (India, USA, UK, Germany, France, Japan, China, Brazil, etc.)
- **Cities:** 30+ major cities worldwide
- **Road Types:** NH, SH, MDR, ODR, VR
- **Statuses:** Report Received, In Progress, Resolved

### Contractors (18)
- Global coverage across all continents
- Specializations: Pothole, Road Repair, Streetlight, Electrical, Drainage
- Contact information included

### Engineers (18)
- Assigned to major cities worldwide
- Jurisdiction and specialization defined
- Contact information (phone, email, office address)
- Auto-assignment ready

### Crime Analytics
- Sample crime data for major cities
- PostGIS location tracking
- Ready for impact analysis

## 🔍 Testing Scenarios

### Test 1: Budget Tracking
1. Go to `/api/budget/issues`
2. Pick an issue
3. Sanction budget: `PATCH /api/budget/issues/:id/sanction`
4. Record spending: `PATCH /api/budget/issues/:id/spend`
5. Check analytics: `GET /api/budget/analytics`

### Test 2: AI Budget Calculation
1. Create a simulation
2. Call `/api/simulations/:id/calculate-budget`
3. Verify AI predictions and confidence scores
4. Check cost factors breakdown

### Test 3: Crime Impact
1. Create a simulation
2. Call `/api/simulations/:id/calculate-crime-impact`
3. Verify crime reduction predictions
4. Check recommendations

### Test 4: Engineer Routing
1. Create a new report (or use existing)
2. Verify engineer auto-assigned
3. Check `/api/engineers/contact/:report_id`
4. Verify contact information returned

### Test 5: Report Filtering
1. Go to Reports page in dashboard
2. Click "Pending" filter
3. Verify only pending reports shown
4. Try other filters (In Progress, Resolved)

## 🐛 Troubleshooting

### Database Errors
```bash
# Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contractors', 'executive_engineers', 'crime_analytics');

# Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('calculate_ai_budget', 'calculate_crime_impact', 'auto_assign_engineer');

# Check sample data
SELECT COUNT(*) FROM reports;  -- Should be 60+
SELECT COUNT(*) FROM contractors;  -- Should be 18
SELECT COUNT(*) FROM executive_engineers;  -- Should be 18
```

### Server Errors
```bash
# Check if route files exist
ls server/src/routes/engineerRoutes.ts
ls server/src/routes/reportsEnhanced.ts

# Check server logs for import errors
npm run dev
```

### API Errors
```bash
# Test endpoints with curl
curl http://localhost:3000/api/budget/analytics
curl http://localhost:3000/api/engineers
curl http://localhost:3000/api/reports/stats
```

## 📚 Documentation

- **Full Implementation Guide:** `IMPLEMENTATION_GUIDE.md`
- **Changes Summary:** `CHANGES_SUMMARY.md`
- **This Quick Start:** `QUICK_START.md`

## 🎉 You're Done!

All features are now ready to use:
- ✅ Budget tracking with issues
- ✅ AI budget predictions
- ✅ Crime impact analytics
- ✅ Engineer auto-assignment
- ✅ Global sample data
- ✅ Enhanced filtering
- ✅ Road information tracking
- ✅ Contractor management

## 🔗 Next Steps

1. **Frontend Integration:** Update dashboard and simulations pages to use new APIs
2. **UI Enhancements:** Add budget tracker and crime analytics visualizations
3. **Testing:** Test all features with real data
4. **Deployment:** Deploy to production environment

## 💡 Pro Tips

1. **Use PostGIS:** All location queries use PostGIS for optimal performance
2. **Pagination:** Use limit/offset for large datasets
3. **Filtering:** Combine multiple filters for precise queries
4. **Caching:** Consider caching analytics results
5. **Monitoring:** Monitor API response times and database performance

## 📞 Need Help?

1. Check the documentation files
2. Review database logs
3. Check API responses in browser console
4. Verify all migrations completed successfully

---

**Happy Coding! 🚀**
