# Safety Score & Analytics System

## Overview

The Safety Score & Analytics system calculates comprehensive safety scores for areas in Bengaluru based on multiple factors including crime rates, infrastructure, reported issues, and time of day. It also provides simulation tools to predict how infrastructure improvements affect safety scores.

## Features

### 1. **Multi-Factor Safety Scoring**
The system calculates safety scores (0-100) based on four weighted factors:

- **Crime Score (40% weight)**: Based on historical crime rate data for Bengaluru areas
- **Infrastructure Score (30% weight)**: Evaluates functional streetlights and police booths
- **Issue Score (20% weight)**: Considers active and resolved safety issues
- **Time Score (10% weight)**: Adjusts for nighttime (8 PM - 6 AM)

### 2. **Bengaluru Crime Data**
Mock crime rate data (crimes per 1000 people per year) for 12 major Bengaluru areas:

| Area | Crime Rate | Zone | Safety Level |
|------|-----------|------|--------------|
| Basavanagudi | 18.4 | South | Low |
| Vijayanagar | 20.1 | West | Low |
| Yelahanka | 22.7 | North | Low |
| JP Nagar | 24.3 | South | Low |
| Malleshwaram | 25.3 | North | Medium |
| Rajajinagar | 27.9 | West | Medium |
| Jayanagar | 28.5 | South | Medium |
| BTM Layout | 31.2 | South | Medium |
| Electronic City | 35.8 | South | High |
| Indiranagar | 38.7 | East | High |
| Whitefield | 42.1 | East | High |
| Koramangala | 45.2 | South | High |

### 3. **Infrastructure Impact Simulation**
Simulate how changes affect safety scores:
- Add streetlights
- Install police booths
- Fix reported issues

The system calculates:
- Before/After scores
- Score improvement
- Grade changes (A+ to F)
- Actionable recommendations

### 4. **Real-Time Analytics**
- Area-wise safety rankings
- Safety score heatmaps
- Trend analysis over time
- Location comparisons

## API Endpoints

### Calculate Safety Score
```http
GET /api/safety-score/calculate?lat=12.9716&lng=77.5946&radius=1000
```

**Response:**
```json
{
  "success": true,
  "data": {
    "location": { "latitude": 12.9716, "longitude": 77.5946 },
    "radius": 1000,
    "crimeScore": 62,
    "infrastructureScore": 45,
    "issueScore": 70,
    "timeScore": 100,
    "overallScore": 61,
    "grade": "C",
    "factors": {
      "crimeRate": 38.7,
      "streetlights": 3,
      "policeBooths": 1,
      "activeIssues": 5,
      "resolvedIssues": 12,
      "isNighttime": false
    }
  }
}
```

### Simulate Infrastructure Impact
```http
POST /api/safety-score/simulate
Content-Type: application/json

{
  "lat": 12.9716,
  "lng": 77.5946,
  "radius": 1000,
  "changes": {
    "addStreetlights": 5,
    "addPoliceBooths": 2,
    "fixIssues": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "before": {
      "overallScore": 61,
      "grade": "C"
    },
    "after": {
      "overallScore": 78,
      "grade": "B"
    },
    "improvement": 17,
    "recommendations": [
      "Add 2 more streetlights to improve infrastructure score",
      "Install at least 2 police booths in this area for better security"
    ]
  }
}
```

### Get All Area Scores
```http
GET /api/safety-score/areas
```

Returns safety scores for all 12 Bengaluru areas, sorted by score.

### Get Crime Data
```http
GET /api/safety-score/crime-data
```

Returns crime rate data for all areas with severity classifications.

### Generate Safety Heatmap
```http
GET /api/safety-score/heatmap?center_lat=12.9716&center_lng=77.5946&grid_size=8
```

Generates a grid of safety scores for map visualization.

### Get Safety Trends
```http
GET /api/safety-score/trends?lat=12.9716&lng=77.5946&days=30
```

Returns historical safety score trends (simulated for demo).

### Compare Locations
```http
POST /api/safety-score/compare
Content-Type: application/json

{
  "locations": [
    { "name": "Koramangala", "lat": 12.9352, "lng": 77.6245 },
    { "name": "Basavanagudi", "lat": 12.9423, "lng": 77.5742 }
  ]
}
```

## Database Schema

### Infrastructure Table
```sql
CREATE TABLE infrastructure (
    infra_id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'functional',
    location GEOGRAPHY(Point, 4326),
    installed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_maintenance TIMESTAMP,
    notes TEXT
);
```

## Setup Instructions

### 1. Add Infrastructure Table
Run the SQL script to create the infrastructure table and populate it with sample data:

```bash
# Connect to your PostgreSQL database and run:
psql -h <your-host> -U <your-user> -d <your-db> -f add-infrastructure-table.sql
```

Or execute in your database SQL editor (Neon, Supabase, etc.):
```sql
-- Copy contents from add-infrastructure-table.sql
```

### 2. Verify Server Routes
The safety score routes are automatically loaded in `server.ts`. Verify by checking:

```bash
curl http://localhost:3000/api/safety-score/areas
```

### 3. Test the API
```bash
# Calculate safety score for Indiranagar
curl "http://localhost:3000/api/safety-score/calculate?lat=12.9716&lng=77.5946&radius=1000"

# Get all area scores
curl "http://localhost:3000/api/safety-score/areas"

# Get crime data
curl "http://localhost:3000/api/safety-score/crime-data"
```

### 4. Use the Dashboard Component
Add the Safety Score Dashboard to your official dashboard:

```tsx
import SafetyScoreDashboard from './components/SafetyScoreDashboard';

// In your router or main component:
<Route path="/safety-scores" element={<SafetyScoreDashboard />} />
```

## Scoring Algorithm

### Overall Score Calculation
```
Overall Score = (Crime Score × 0.40) + 
                (Infrastructure Score × 0.30) + 
                (Issue Score × 0.20) + 
                (Time Score × 0.10)
```

### Crime Score
```
Crime Score = max(0, min(100, 100 - (Crime Rate × 2)))
```
- 0 crimes/1000 = 100 points
- 50+ crimes/1000 = 0 points

### Infrastructure Score
```
Light Score = min(100, (Functional Lights × 10) - (Broken Lights × 5))
Booth Score = min(100, Police Booths × 20)
Infrastructure Score = (Light Score × 0.7) + (Booth Score × 0.3)
```

### Issue Score
```
Issue Score = max(0, 100 - (Active Issues × 10) - (Avg Severity × 2))
```

### Time Score
```
Time Score = Nighttime (8 PM - 6 AM) ? 60 : 100
```

### Grade Assignment
- **A+**: 90-100
- **A**: 80-89
- **B**: 70-79
- **C**: 60-69
- **D**: 50-59
- **F**: 0-49

## Use Cases

### 1. **Urban Planning**
- Identify areas needing infrastructure improvements
- Prioritize streetlight installations
- Plan police booth locations

### 2. **Budget Allocation**
- Simulate ROI of infrastructure investments
- Compare cost vs. safety improvement
- Justify budget requests with data

### 3. **Citizen Safety**
- Show real-time safety scores to citizens
- Recommend safer routes
- Alert about high-crime areas

### 4. **Performance Tracking**
- Monitor safety improvements over time
- Track impact of completed projects
- Generate reports for stakeholders

## Example Scenarios

### Scenario 1: Improving Koramangala (High Crime Area)
**Current State:**
- Crime Rate: 45.2 (High)
- Streetlights: 2 functional, 1 broken
- Police Booths: 1
- Overall Score: 52 (Grade D)

**Simulation: Add 5 streetlights, 2 police booths, fix 1 broken light**
- New Score: 68 (Grade C)
- Improvement: +16 points
- Recommendation: Add 2 more police booths for Grade B

### Scenario 2: Maintaining Basavanagudi (Low Crime Area)
**Current State:**
- Crime Rate: 18.4 (Low)
- Streetlights: 4 functional
- Police Booths: 2
- Overall Score: 87 (Grade A)

**Simulation: Add 2 more streetlights**
- New Score: 92 (Grade A+)
- Improvement: +5 points

## Future Enhancements

1. **Machine Learning Integration**
   - Predict crime hotspots
   - Optimize infrastructure placement
   - Forecast safety trends

2. **Real Crime Data Integration**
   - Connect to Bengaluru Police API
   - Real-time crime incident updates
   - Historical crime pattern analysis

3. **Advanced Analytics**
   - Correlation analysis (infrastructure vs. crime)
   - Seasonal safety patterns
   - Demographic factors

4. **Mobile App Integration**
   - Push notifications for safety alerts
   - Citizen-reported safety concerns
   - Crowdsourced safety ratings

## Testing

### Unit Tests
```bash
npm test -- safetyScoreService.test.ts
```

### Integration Tests
```bash
npm run test:integration -- safety-score
```

### Manual Testing Checklist
- [ ] Calculate score for each Bengaluru area
- [ ] Run simulation with various parameters
- [ ] Verify score changes when infrastructure is added
- [ ] Test nighttime vs. daytime scoring
- [ ] Compare multiple locations
- [ ] Generate heatmap data
- [ ] Check trend analysis

## Support

For questions or issues:
- Check API documentation: `/api/safety-score/*`
- Review code: `server/src/services/safetyScoreService.ts`
- Test endpoints: Use Postman collection (coming soon)

## License

Part of the WinGuard Urban Safety Platform
