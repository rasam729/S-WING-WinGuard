# WinGuard System Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WinGuard Platform                            │
│                    Road Safety Management System                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼────────┐            ┌────────▼────────┐
            │  Citizen App   │            │ Official Dashboard│
            │   (Mobile)     │            │    (Web)         │
            └───────┬────────┘            └────────┬────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                            ┌───────▼────────┐
                            │   API Server   │
                            │   (Express)    │
                            └───────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼────┐  ┌──────▼──────┐  ┌────▼─────┐
            │ PostgreSQL │  │   PostGIS   │  │  Redis   │
            │  Database  │  │  Spatial DB │  │  Cache   │
            └────────────┘  └─────────────┘  └──────────┘
```

---

## 📊 Database Architecture

### Core Tables

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Database Schema                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│     reports      │◄────────│  executive_      │
│                  │         │  engineers       │
│ • report_id (PK) │         │                  │
│ • category       │         │ • engineer_id(PK)│
│ • severity       │         │ • engineer_name  │
│ • location       │         │ • jurisdiction   │
│ • status         │         │ • specialization │
│ • road_type      │         │ • workload       │
│ • road_name      │         │ • contact_info   │
│ • contractor_id  │         └──────────────────┘
│ • engineer_id(FK)│                 │
│ • estimated_cost │                 │
│ • sanctioned_amt │                 │
│ • spent_amount   │                 │
│ • ward_name      │                 │
│ • city           │                 │
│ • country        │                 │
└────────┬─────────┘                 │
         │                           │
         │         ┌─────────────────┘
         │         │
         │    ┌────▼──────────┐
         │    │  contractors  │
         └────►                │
              │ • contractor_id│
              │ • name         │
              │ • company      │
              │ • specialization│
              │ • rating       │
              │ • city/country │
              └────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  simulations     │◄────────│ budget_          │
│                  │         │ simulations      │
│ • simulation_id  │         │                  │
│ • name           │         │ • budget_sim_id  │
│ • center_lat/lng │         │ • simulation_id  │
│ • radius_meters  │         │ • estimated_cost │
│ • safety_score   │         │ • ai_predicted   │
│ • crime_before   │         │ • confidence     │
│ • crime_after    │         │ • cost_factors   │
│ • status         │         └──────────────────┘
└────────┬─────────┘
         │
         │         ┌──────────────────┐
         └────────►│ infrastructure   │
                   │                  │
                   │ • infra_id       │
                   │ • type           │
                   │ • location       │
                   │ • status         │
                   │ • simulation_id  │
                   │ • is_simulated   │
                   └──────────────────┘

┌──────────────────┐
│ crime_analytics  │
│                  │
│ • crime_id       │
│ • location       │
│ • crime_type     │
│ • severity       │
│ • status         │
│ • city/country   │
│ • simulation_id  │
└──────────────────┘
```

---

## 🔄 Data Flow Architecture

### 1. Report Submission Flow

```
Citizen App
    │
    │ 1. Submit Report
    │    (category, location, photo)
    ▼
API Server
    │
    │ 2. Validate Data
    │
    ▼
PostgreSQL
    │
    │ 3. Insert Report
    │
    ▼
Trigger: auto_assign_engineer()
    │
    │ 4. Find Engineer
    │    - Match jurisdiction
    │    - Match specialization
    │    - Check workload
    │
    ▼
Update Report
    │
    │ 5. Assign Engineer
    │    - Set engineer_id
    │    - Increment workload
    │
    ▼
Notification Service
    │
    │ 6. Notify Engineer
    │
    ▼
Engineer Dashboard
```

### 2. Budget Tracking Flow

```
Official Dashboard
    │
    │ 1. View Issue
    │
    ▼
API: GET /api/budget/issues
    │
    │ 2. Fetch Issues with Budget
    │
    ▼
Display Issue Details
    │
    │ 3. Sanction Budget
    │    (amount_sanctioned)
    ▼
API: PATCH /api/budget/issues/:id/sanction
    │
    │ 4. Update Report
    │    - Set amount_sanctioned
    │    - Change status to "In Progress"
    │
    ▼
Contractor Works
    │
    │ 5. Record Spending
    │    (amount_spent)
    ▼
API: PATCH /api/budget/issues/:id/spend
    │
    │ 6. Update Report
    │    - Set amount_spent
    │    - Calculate variance
    │    - Update status if complete
    │
    ▼
Budget Analytics
    │
    │ 7. View Analytics
    │
    ▼
API: GET /api/budget/analytics
```

### 3. AI Budget Calculation Flow

```
Simulations Page
    │
    │ 1. Create Simulation
    │
    ▼
API: POST /api/simulations
    │
    │ 2. Add Infrastructure
    │    (potholes to fix)
    ▼
API: POST /api/simulations/:id/add-infrastructure
    │
    │ 3. Calculate Budget
    │
    ▼
API: POST /api/simulations/:id/calculate-budget
    │
    │ 4. Call AI Function
    │
    ▼
Function: calculate_ai_budget()
    │
    ├─► 5a. Get Location Multiplier
    │        (urban vs rural)
    │
    ├─► 5b. Get Road Type Multiplier
    │        (NH: 1.5x, SH: 1.3x, etc.)
    │
    ├─► 5c. Count Nearby Issues
    │        (for bulk discount)
    │
    └─► 5d. Calculate Final Cost
             │
             │ 6. Return Results
             │    - estimated_cost
             │    - ai_predicted_cost
             │    - confidence_score
             │    - cost_factors
             │    - savings
             │    - recommendation
             ▼
Display Budget Card
```

### 4. Crime Impact Analysis Flow

```
Simulations Page
    │
    │ 1. Add Infrastructure
    │    (streetlights, police booths)
    ▼
API: POST /api/simulations/:id/calculate-crime-impact
    │
    │ 2. Call Crime Function
    │
    ▼
Function: calculate_crime_impact()
    │
    ├─► 3a. Count Current Crimes
    │        (within radius, last 6 months)
    │
    ├─► 3b. Calculate Streetlight Impact
    │        (15% reduction per cluster)
    │
    ├─► 3c. Calculate Police Booth Impact
    │        (25% reduction each)
    │
    └─► 3d. Calculate Total Reduction
             │        (max 70%)
             │
             │ 4. Return Results
             │    - crime_incidents_before
             │    - crime_incidents_after
             │    - predicted_reduction
             │    - incidents_prevented
             │    - recommendation
             ▼
Display Crime Analytics Card
```

---

## 🔌 API Architecture

### API Endpoints Structure

```
/api
├── /reports
│   ├── GET    /all                    # All reports (no auth)
│   ├── GET    /                       # User's reports (auth)
│   ├── POST   /                       # Create report
│   ├── GET    /:id                    # Get single report
│   ├── GET    /enhanced               # Enhanced filtering
│   ├── GET    /dashboard              # Dashboard map data
│   ├── GET    /stats                  # Statistics
│   └── PATCH  /:id/update             # Update with road info
│
├── /budget
│   ├── GET    /issues                 # Issues with budget
│   ├── PATCH  /issues/:id/sanction    # Sanction budget
│   ├── PATCH  /issues/:id/spend       # Record spending
│   └── GET    /analytics              # Budget analytics
│
├── /simulations
│   ├── POST   /                       # Create simulation
│   ├── GET    /                       # List simulations
│   ├── POST   /:id/add-infrastructure # Add infrastructure
│   ├── POST   /:id/calculate-impact   # Calculate safety impact
│   ├── POST   /:id/calculate-budget   # AI budget calculation
│   ├── POST   /:id/calculate-crime-impact # Crime analytics
│   ├── GET    /:id/issues             # Issues in area
│   └── POST   /:id/apply              # Apply to production
│
├── /engineers
│   ├── GET    /                       # List engineers
│   ├── GET    /:id                    # Engineer details
│   ├── GET    /:id/issues             # Engineer's issues
│   ├── POST   /auto-assign            # Auto-assign engineer
│   └── GET    /contact/:report_id     # Get contact info
│
├── /contractors
│   ├── GET    /                       # List contractors
│   ├── GET    /:id                    # Contractor details
│   └── GET    /:id/projects           # Contractor's projects
│
└── /analytics
    ├── GET    /overview               # Dashboard stats
    ├── GET    /reports-by-category    # Category distribution
    ├── GET    /reports-timeline       # Time series
    └── GET    /budget-utilization     # Budget spending
```

---

## 🧩 Component Architecture

### Frontend Components

```
Official Dashboard
├── Pages
│   ├── DashboardPage
│   │   ├── MapView (Leaflet)
│   │   ├── StatsCards
│   │   └── IssueMarkers
│   │
│   ├── SimulationsPage
│   │   ├── MapView
│   │   ├── ToolsPanel
│   │   ├── ChangesPanel
│   │   ├── ImpactAnalysisCard
│   │   ├── BudgetTrackerCard ⭐ NEW
│   │   └── CrimeAnalyticsCard ⭐ NEW
│   │
│   ├── ReportsPage ⭐ ENHANCED
│   │   ├── FilterTabs (Fixed)
│   │   ├── ReportsList
│   │   └── ReportCard
│   │
│   ├── BudgetPage
│   │   ├── OverviewTab
│   │   ├── AllocationsTab
│   │   ├── ExpensesTab
│   │   └── TransparencyTab
│   │
│   └── IssuesPage
│       ├── IssuesList
│       ├── IssueCard
│       └── StatusUpdater
│
└── Components
    ├── Sidebar
    ├── Header
    ├── MapComponent
    └── Charts (Chart.js)

Citizen App
├── Pages
│   ├── HomePage
│   ├── ReportPage
│   │   ├── CategorySelector
│   │   ├── LocationPicker
│   │   ├── PhotoUploader
│   │   └── SubmitButton
│   │
│   └── MyReportsPage
│       ├── ReportsList
│       └── ReportStatus
│
└── Components
    ├── BottomNav
    ├── MapView
    └── NotificationBadge
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Security Layers                              │
└─────────────────────────────────────────────────────────────────────┘

1. Authentication Layer
   ┌──────────────────┐
   │   JWT Tokens     │
   │                  │
   │ • Login          │
   │ • Token Verify   │
   │ • Role Check     │
   └──────────────────┘

2. Authorization Layer
   ┌──────────────────┐
   │  Role-Based      │
   │  Access Control  │
   │                  │
   │ • Citizen        │
   │ • Official       │
   │ • Admin          │
   └──────────────────┘

3. Data Validation Layer
   ┌──────────────────┐
   │  Input           │
   │  Validation      │
   │                  │
   │ • Type Check     │
   │ • Range Check    │
   │ • SQL Injection  │
   │ • XSS Prevention │
   └──────────────────┘

4. Database Security
   ┌──────────────────┐
   │  PostgreSQL      │
   │  Security        │
   │                  │
   │ • Parameterized  │
   │ • Row-Level      │
   │ • Encryption     │
   └──────────────────┘
```

---

## 📈 Scalability Architecture

### Horizontal Scaling

```
                    ┌─────────────┐
                    │ Load        │
                    │ Balancer    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ API     │       │ API     │       │ API     │
   │ Server 1│       │ Server 2│       │ Server 3│
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │ Primary     │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ Read    │       │ Read    │       │ Read    │
   │ Replica1│       │ Replica2│       │ Replica3│
   └─────────┘       └─────────┘       └─────────┘
```

### Caching Strategy

```
Request Flow with Caching:

Client Request
    │
    ▼
API Server
    │
    ├─► Check Redis Cache
    │   │
    │   ├─► Cache Hit ──► Return Cached Data
    │   │
    │   └─► Cache Miss
    │           │
    │           ▼
    │       Query Database
    │           │
    │           ▼
    │       Store in Cache
    │           │
    │           ▼
    └───────► Return Data

Cache Keys:
• reports:all
• reports:city:{city}
• reports:country:{country}
• budget:analytics
• engineers:list
• stats:overview
```

---

## 🔄 Integration Points

### External Services

```
WinGuard Platform
    │
    ├─► OpenStreetMap (Nominatim)
    │   └─► Geocoding & Reverse Geocoding
    │
    ├─► Leaflet.js
    │   └─► Interactive Maps
    │
    ├─► PostGIS
    │   └─► Spatial Queries
    │
    ├─► Email Service (Future)
    │   └─► Notifications
    │
    └─► SMS Service (Future)
        └─► Alerts
```

---

## 📊 Monitoring & Logging

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Monitoring Architecture                           │
└─────────────────────────────────────────────────────────────────────┘

Application Logs
    │
    ├─► API Request Logs
    │   • Endpoint
    │   • Response Time
    │   • Status Code
    │
    ├─► Database Query Logs
    │   • Query Text
    │   • Execution Time
    │   • Rows Affected
    │
    └─► Error Logs
        • Error Type
        • Stack Trace
        • Context

Performance Metrics
    │
    ├─► API Response Times
    ├─► Database Query Times
    ├─► Cache Hit Rates
    └─► Memory Usage

Business Metrics
    │
    ├─► Reports Submitted
    ├─► Issues Resolved
    ├─► Budget Utilization
    └─► Engineer Workload
```

---

## 🎯 Key Features Architecture

### 1. AI Budget Calculation

```
Input:
• issue_type
• base_cost
• location (lat/lng)
• road_type

Processing:
┌─────────────────────┐
│ calculate_ai_budget │
├─────────────────────┤
│ 1. Location Factor  │
│    (urban vs rural) │
│                     │
│ 2. Road Type Factor │
│    (NH, SH, MDR...) │
│                     │
│ 3. Nearby Issues    │
│    (bulk discount)  │
│                     │
│ 4. Calculate Cost   │
│    & Confidence     │
└─────────────────────┘

Output:
• estimated_cost
• ai_predicted_cost
• confidence_score (75-95%)
• cost_factors (JSON)
• savings
• recommendation
```

### 2. Crime Impact Analysis

```
Input:
• location (lat/lng)
• radius_meters
• new_streetlights
• new_police_booths

Processing:
┌──────────────────────┐
│calculate_crime_impact│
├──────────────────────┤
│ 1. Count Current     │
│    Crimes (6 months) │
│                      │
│ 2. Streetlight Impact│
│    (15% each)        │
│                      │
│ 3. Police Impact     │
│    (25% each)        │
│                      │
│ 4. Total Reduction   │
│    (max 70%)         │
└──────────────────────┘

Output:
• crime_incidents_before
• crime_incidents_after
• predicted_reduction (%)
• incidents_prevented
• recommendation
```

### 3. Engineer Auto-Assignment

```
Trigger: New Report Created

Processing:
┌──────────────────────┐
│ auto_assign_engineer │
├──────────────────────┤
│ 1. Match Jurisdiction│
│    (ward_name)       │
│                      │
│ 2. Match Specializ.  │
│    (category)        │
│                      │
│ 3. Check City        │
│    (same city)       │
│                      │
│ 4. Find Lowest       │
│    Workload          │
│                      │
│ 5. Assign & Update   │
│    Workload          │
└──────────────────────┘

Output:
• engineer_id assigned
• workload incremented
• report updated
```

---

## 🌍 Global Data Distribution

```
Sample Data Coverage:

Asia (6 countries)
├── India (Bangalore, Mumbai, Delhi)
├── China (Beijing)
├── Japan (Tokyo)
├── South Korea (Seoul)
├── Singapore
└── UAE (Dubai)

Europe (8 countries)
├── UK (London, Manchester)
├── Germany (Berlin, Munich)
├── France (Paris)
├── Spain (Madrid)
├── Italy (Rome)
├── Netherlands (Amsterdam)
├── Sweden (Stockholm)
└── Russia (Moscow, St. Petersburg)

Americas (4 countries)
├── USA (New York, LA, Chicago)
├── Canada (Toronto)
├── Brazil (São Paulo)
└── Argentina (Buenos Aires)

Africa (2 countries)
├── South Africa (Johannesburg)
└── Egypt (Cairo)

Oceania (1 country)
└── Australia (Sydney, Melbourne)

Total: 25+ countries, 30+ cities, 60+ sample issues
```

---

## 📦 Deployment Architecture

```
Development Environment
    │
    ├─► Local PostgreSQL
    ├─► Local Redis
    └─► Node.js Dev Server

Staging Environment
    │
    ├─► Cloud PostgreSQL (Neon/Supabase)
    ├─► Cloud Redis
    └─► Staging Server

Production Environment
    │
    ├─► Production PostgreSQL (Replicated)
    ├─► Production Redis (Cluster)
    ├─► Load Balancer
    ├─► Multiple API Servers
    └─► CDN for Static Assets
```

---

This architecture supports:
- ✅ Scalability (horizontal scaling)
- ✅ Performance (caching, indexes)
- ✅ Security (authentication, validation)
- ✅ Reliability (replication, backups)
- ✅ Maintainability (modular design)
- ✅ Extensibility (plugin architecture)

---

**Architecture Version:** 2.0.0
**Last Updated:** May 28, 2026
**Status:** Production Ready
