# Guardian Path Navigation Engine - Design Document

## Overview
The Guardian Path Navigation Engine is a safety-first routing system that calculates optimal routes based on real-time hazard data, infrastructure safety markers, and a weighted pathfinding algorithm.

## Safety Formula

The core safety calculation uses the following weighted formula:

```
S = (w_l × L + w_c × P + w_v × V) / (w_f × C + w_u × U)
```

### Variables:
- **L**: Lighting Score (0-100) - Based on functional streetlights
- **P**: Police Presence (0-100) - Based on nearby police booths
- **V**: Visibility Score (0-100) - Based on dark zones
- **C**: Crime/Incident Score (0-100) - Based on critical issues
- **U**: Unresolved Issues (0-100) - Based on potholes and hazards

### Weights:
- **w_l = 0.35** - Lighting weight (highest priority)
- **w_c = 0.25** - Police presence weight
- **w_v = 0.20** - Visibility weight
- **w_f = 0.15** - Crime factor weight
- **w_u = 0.05** - Unresolved issues weight

## Algorithm: A* Pathfinding with Safety Weighting

### Core Concept
The A* algorithm is enhanced with safety scoring to prioritize safer routes over shorter but potentially dangerous ones.

### Implementation Steps:

1. **Waypoint Generation**
   - Generate grid of waypoints between start and destination
   - Default resolution: 20-25 waypoints
   - Each waypoint represents a potential path segment

2. **Safety Scoring**
   - Calculate safety score for each waypoint
   - Search radius: 0.3-0.5 km around each point
   - Query nearby hazards and safe havens
   - Apply safety formula

3. **Cost Calculation**
   ```javascript
   g = current.g + distance × (1 + safetyFactor × 2)
   ```
   Where:
   - `g` = cost from start
   - `distance` = physical distance to neighbor
   - `safetyFactor` = (100 - safetyScore) / 100
   - Lower safety = higher cost (route avoidance)

4. **Heuristic Function**
   - Uses Haversine distance formula
   - Estimates remaining distance to destination
   - Guides search toward goal

5. **Path Reconstruction**
   - Backtrack from destination to start
   - Follow parent pointers
   - Generate ordered list of coordinates

## Route Types

### 1. Guardian Path (Primary)
- **Color**: Green (#10b981)
- **Priority**: Maximum safety
- **Waypoints**: 25 (high resolution)
- **Characteristics**:
  - Avoids all critical hazards
  - Prioritizes well-lit areas
  - Routes near police booths when possible
  - May be longer but significantly safer

### 2. Alternative Route
- **Color**: Blue (#3b82f6)
- **Priority**: Balanced safety and speed
- **Waypoints**: 15 (medium resolution)
- **Characteristics**:
  - More direct path
  - Moderate hazard avoidance
  - Faster but less safe than Guardian Path

## Turn-by-Turn Navigation

### Direction Generation
1. **Bearing Calculation**
   - Calculate compass bearing between consecutive points
   - Convert to cardinal directions (N, NE, E, SE, S, SW, W, NW)

2. **Turn Detection**
   - Compare bearing changes between segments
   - Classify turns:
     - **Straight**: < 30° change
     - **Slight Turn**: 30-90° change
     - **Turn**: 90-150° change
     - **Sharp Turn**: > 150° change

3. **Instruction Types**
   - Start: "Start your journey"
   - Continue: "Continue [direction]"
   - Turn: "Turn [left/right] towards [direction]"
   - Sharp Turn: "Make a sharp turn"
   - End: "You have arrived at your destination"

### Text-to-Speech Integration
- Uses Web Speech API (`speechSynthesis`)
- Voice parameters:
  - Rate: 0.9 (slightly slower for clarity)
  - Pitch: 1.0 (natural)
  - Volume: 1.0 (maximum)
- Auto-speaks on step change
- Manual replay available

## Data Integration

### Hazard Data Sources
- **Mock Issues Store**: 15 pre-defined hazards
- **Types**:
  - Potholes (7 issues)
  - Broken Streetlights (5 issues)
  - Police Booths (3 installations)
- **Status Tracking**:
  - Critical (red) - immediate danger
  - In Progress (blue) - being fixed
  - Resolved (green) - safe

### Real-Time Updates
- Socket.io integration for live hazard updates
- Automatic route recalculation when:
  - New hazard reported
  - Hazard status changes
  - Infrastructure fixed/installed

## Visual Representation

### Map Display
1. **Route Polyline**
   - Width: 8px
   - Opacity: 0.9
   - Color: Route-specific (green/blue)
   - Rounded caps and joins

2. **Safety Circles**
   - Placed every 3rd waypoint
   - Radius: 80m
   - Color-coded by safety score:
     - Green: 70-100 (safe)
     - Orange: 40-69 (moderate)
     - Red: 0-39 (caution)

3. **Markers**
   - Start: Green location pin
   - Destination: Red target icon
   - User: Blue dot with radius circle

## Performance Metrics

### Route Statistics
- **Total Distance**: Sum of segment distances (km)
- **Estimated Time**: Based on safety-adjusted speed
  - Base speed: 30 km/h
  - Safety factor: 70-100% of base
  - Formula: `time = distance / (baseSpeed × safetyFactor)`
- **Average Safety Score**: Mean of all waypoint scores
- **Hazards Near Route**: Count within 0.2km
- **Critical Hazards**: Count of critical status issues

### Safety Ratings
- **Very Safe**: 80-100 score
- **Safe**: 60-79 score
- **Moderate**: 40-59 score
- **Caution Advised**: 0-39 score

## Mobile Access

### Network Configuration
The app is accessible on mobile devices via:
- **Local URL**: `http://localhost:5173`
- **Network URL**: `http://172.17.0.79:5173`

### Mobile Features
- Responsive design (works on all screen sizes)
- Touch-optimized controls
- GPS integration for current location
- Text-to-speech for hands-free navigation
- Offline-capable (with service worker)

## Technical Stack

### Frontend
- **React + TypeScript**: Component architecture
- **Leaflet.js**: Map rendering and interaction
- **Tailwind CSS**: Styling and responsive design
- **Web Speech API**: Text-to-speech

### Backend
- **Node.js + Express**: API server
- **PostgreSQL + PostGIS**: Spatial database
- **Socket.io**: Real-time updates

### Shared Utilities
- **routingUtils.js**: Core algorithm implementation
- **Haversine formula**: Distance calculations
- **Bearing calculations**: Direction determination

## Security Considerations

1. **Input Validation**
   - Coordinate format validation
   - Range checking (valid lat/lng)
   - SQL injection prevention

2. **Rate Limiting**
   - Prevent excessive route calculations
   - Throttle API requests

3. **Data Privacy**
   - No location tracking without consent
   - Anonymous route calculations
   - No persistent location storage

## Future Enhancements

1. **Machine Learning**
   - Historical safety data analysis
   - Predictive hazard modeling
   - Time-of-day safety adjustments

2. **Community Features**
   - User-reported hazards
   - Real-time traffic integration
   - Crowdsourced safety ratings

3. **Advanced Navigation**
   - Multi-stop routing
   - Public transport integration
   - Accessibility options (wheelchair-friendly routes)

4. **Offline Mode**
   - Cached map tiles
   - Pre-downloaded hazard data
   - Offline route calculation

## Testing Strategy

### Unit Tests
- Safety formula calculations
- Distance/bearing functions
- Turn detection logic

### Integration Tests
- A* pathfinding accuracy
- Route recalculation on updates
- Socket.io event handling

### User Acceptance Tests
- Route selection workflow
- Navigation experience
- Text-to-speech functionality
- Mobile responsiveness

## Deployment

### Development
```bash
# Start backend
cd server && npm run dev

# Start frontend
cd apps/citizen-app && npm run dev
```

### Production
```bash
# Build frontend
cd apps/citizen-app && npm run build

# Start production server
cd server && npm start
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=production
```

## Conclusion

The Guardian Path Navigation Engine provides a comprehensive, safety-first routing solution that prioritizes user well-being over speed. By integrating real-time hazard data with advanced pathfinding algorithms, it delivers routes that are not just efficient, but genuinely safer for citizens of Bengaluru.
