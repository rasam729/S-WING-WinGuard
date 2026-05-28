# WinGuard API Documentation

Complete API reference for the WinGuard Urban Safety Platform backend.

**Base URL**: `http://localhost:3000/api`

---

## 🔐 Authentication

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "citizen"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "citizen"
  }
}
```

---

## 📋 Reports

### Get All Reports
```http
GET /api/reports/all
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "reports": [...],
    "total": 100
  }
}
```

### Create Report
```http
POST /api/reports
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "category": "Pothole",
  "severity": 8,
  "description": "Large pothole on main road",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "photo": <file>
}
```

### Update Report Status
```http
PUT /api/reports/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "In Progress"
}
```

---

## 🏗️ Contractors

### Get All Contractors
```http
GET /api/contractors
Authorization: Bearer {token}

Query Parameters:
- status: active | suspended | blacklisted
- specialization: string
- minRating: number

Response:
{
  "success": true,
  "data": [
    {
      "contractor_id": "CTR001",
      "company_name": "ABC Construction",
      "rating": 4.5,
      "completed_projects": 25,
      "ongoing_projects": 3,
      ...
    }
  ]
}
```

### Get Contractor by ID
```http
GET /api/contractors/:id
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "contractor_id": "CTR001",
    "company_name": "ABC Construction",
    "assignments": [...]
  }
}
```

### Create Contractor
```http
POST /api/contractors
Authorization: Bearer {token}
Content-Type: application/json

{
  "contractor_id": "CTR001",
  "company_name": "ABC Construction",
  "contact_person": "John Doe",
  "email": "contact@abc.com",
  "phone": "+91-9876543210",
  "specialization": ["road_repair", "streetlight_installation"],
  "experience": 10
}
```

### Assign Contractor to Issue
```http
POST /api/contractors/:id/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "assignment_id": "ASN001",
  "issue_id": 123,
  "assigned_by": 1,
  "expected_completion_date": "2026-06-15",
  "contract_value": 50000,
  "advance_payment": 15000
}
```

### Rate Contractor
```http
POST /api/contractors/:id/rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "assignment_id": "ASN001",
  "quality_rating": 4.5,
  "timeliness_rating": 4.0,
  "communication_rating": 5.0
}
```

---

## 💰 Budget & Transparency

### Get Budget Overview
```http
GET /api/budget/overview
Authorization: Bearer {token}

Query Parameters:
- fiscal_year: string (e.g., "2025-26")

Response:
{
  "success": true,
  "data": {
    "allocations": [...],
    "totals": {
      "total_allocated": 10000000,
      "total_spent": 6500000,
      "total_available": 3500000
    }
  }
}
```

### Get Budget Allocations
```http
GET /api/budget/allocations
Authorization: Bearer {token}

Query Parameters:
- source_type: central_govt | state_govt | municipal | private | donor
- fiscal_year: string
```

### Get Budget Categories
```http
GET /api/budget/categories
Authorization: Bearer {token}

Query Parameters:
- allocation_id: string

Response:
{
  "success": true,
  "data": [
    {
      "category_id": "CAT001",
      "category": "Road Repair",
      "allocated": 5000000,
      "spent": 3200000,
      "available": 1800000,
      "percentage": 64.0
    }
  ]
}
```

### Get Expenses
```http
GET /api/budget/expenses
Authorization: Bearer {token}

Query Parameters:
- category: string
- contractor_id: string
- publicly_visible: boolean
```

### Create Expense
```http
POST /api/budget/expense
Authorization: Bearer {token}
Content-Type: application/json

{
  "expense_id": "EXP001",
  "issue_id": 123,
  "category": "Road Repair",
  "estimated_cost": 50000,
  "sanctioned_amount": 48000,
  "actual_cost": 47500,
  "contractor_id": "CTR001",
  "contractor_name": "ABC Construction",
  "publicly_visible": true
}
```

### Get Transparency Data
```http
GET /api/budget/transparency
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "allocations": [...],
    "expenses": [...]
  }
}
```

---

## 🔧 Maintenance & Repairs

### Get Maintenance Schedules
```http
GET /api/maintenance/schedules
Authorization: Bearer {token}

Query Parameters:
- asset_type: road | streetlight | drainage | bridge | signal
- status: scheduled | in_progress | completed | overdue
- upcoming: boolean

Response:
{
  "success": true,
  "data": [
    {
      "schedule_id": "SCH001",
      "asset_type": "streetlight",
      "next_maintenance": "2026-06-15",
      "status": "scheduled",
      ...
    }
  ]
}
```

### Get Upcoming Maintenance
```http
GET /api/maintenance/upcoming
Authorization: Bearer {token}

Response: Maintenance scheduled in next 30 days
```

### Get Overdue Maintenance
```http
GET /api/maintenance/overdue
Authorization: Bearer {token}

Response: Overdue maintenance items
```

### Create Maintenance Schedule
```http
POST /api/maintenance/schedule
Authorization: Bearer {token}
Content-Type: application/json

{
  "schedule_id": "SCH001",
  "asset_type": "streetlight",
  "asset_id": "SL001",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "frequency": "monthly",
  "next_maintenance": "2026-06-15",
  "type": "preventive",
  "estimated_cost": 5000
}
```

### Get Repair History
```http
GET /api/repairs/history
Authorization: Bearer {token}

Query Parameters:
- asset_id: string
- contractor_id: string
- status: completed | under_warranty | warranty_expired
```

### Create Repair Record
```http
POST /api/repairs
Authorization: Bearer {token}
Content-Type: application/json

{
  "repair_id": "REP001",
  "issue_id": 123,
  "asset_id": "SL001",
  "reported_date": "2026-05-01",
  "repair_start_date": "2026-05-05",
  "repair_end_date": "2026-05-06",
  "contractor_id": "CTR001",
  "estimated_cost": 5000,
  "actual_cost": 4800,
  "warranty_period": 180
}
```

---

## 👷 Engineers & Routing

### Get All Engineers
```http
GET /api/engineers
Authorization: Bearer {token}

Query Parameters:
- availability: available | busy | on_leave
- jurisdiction_type: geographic | category | both

Response:
{
  "success": true,
  "data": [
    {
      "engineer_id": "ENG001",
      "name": "John Smith",
      "designation": "Executive Engineer",
      "current_load": 5,
      "max_concurrent_issues": 10,
      "rating": 4.5,
      ...
    }
  ]
}
```

### Get Engineer Details
```http
GET /api/engineers/:id
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "engineer_id": "ENG001",
    "name": "John Smith",
    "assignments": [...]
  }
}
```

### Auto-Assign Issue
```http
POST /api/routing/auto-assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "issue_id": 123,
  "category": "Pothole",
  "severity": 8,
  "ward": "Ward 15",
  "road_type": "arterial"
}

Response:
{
  "success": true,
  "data": {
    "assignment": {...},
    "engineer": {...},
    "rule": {...}
  }
}
```

### Manual Assign Issue
```http
POST /api/routing/manual-assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "issue_id": 123,
  "engineer_id": "ENG001",
  "assigned_by": 1,
  "notes": "High priority issue"
}
```

### Escalate Issue
```http
POST /api/routing/escalate
Authorization: Bearer {token}
Content-Type: application/json

{
  "assignment_id": "ASN001",
  "escalation_reason": "Not resolved within SLA"
}
```

### Get Routing Rules
```http
GET /api/routing/rules
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "rule_id": "RULE001",
      "priority": 1,
      "category": "Pothole",
      "severity_min": 7,
      "assign_to": "ENG001",
      ...
    }
  ]
}
```

---

## 📊 Analytics

### Get Analytics Data
```http
GET /api/analytics
Authorization: Bearer {token}

Query Parameters:
- days: number (7, 30, 90, 365)

Response:
{
  "success": true,
  "data": {
    "totalReports": 500,
    "resolvedReports": 350,
    "pendingReports": 150,
    "avgResolutionTime": 48,
    "reportsByCategory": {...},
    "reportsBySeverity": {...},
    "reportsByRoadType": {...},
    "timeSeriesData": [...],
    "resolutionTimeByCategory": {...},
    "costByCategory": {...}
  }
}
```

---

## 🔔 Notifications

### Get Notifications
```http
GET /api/notifications
Authorization: Bearer {token}

Query Parameters:
- user_id: number
- unread: boolean

Response:
{
  "success": true,
  "data": [
    {
      "notification_id": 1,
      "message": "Your report has been resolved",
      "type": "success",
      "sent_at": "2026-05-28T10:00:00Z",
      "read_at": null
    }
  ]
}
```

### Create Notification
```http
POST /api/notifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 1,
  "report_id": 123,
  "message": "Your report is being processed",
  "type": "info"
}
```

### Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer {token}
```

---

## 🗺️ Map & Infrastructure

### Get Infrastructure
```http
GET /api/infrastructure
Authorization: Bearer {token}

Query Parameters:
- type: streetlight | police_booth | cctv | hospital
- status: functional | broken | under_maintenance

Response:
{
  "success": true,
  "data": [
    {
      "infra_id": 1,
      "type": "streetlight",
      "status": "functional",
      "latitude": 12.9716,
      "longitude": 77.5946,
      ...
    }
  ]
}
```

### Add Infrastructure
```http
POST /api/infrastructure
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "streetlight",
  "status": "functional",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "notes": "New installation"
}
```

---

## 🛣️ Safe Routes

### Calculate Safe Route
```http
POST /api/routes/safe
Authorization: Bearer {token}
Content-Type: application/json

{
  "start": [12.9716, 77.5946],
  "end": [12.9352, 77.6245],
  "avoidIssues": true
}

Response:
{
  "success": true,
  "route": {
    "coordinates": [...],
    "distance": 5.2,
    "duration": 15,
    "safetyScore": 85
  }
}
```

---

## 🎯 Safety Scores

### Get Safety Score
```http
GET /api/safety-score
Authorization: Bearer {token}

Query Parameters:
- latitude: number
- longitude: number
- radius: number (meters)

Response:
{
  "success": true,
  "data": {
    "score": 75,
    "factors": {
      "infrastructure": 80,
      "crime_rate": 70,
      "lighting": 85,
      "maintenance": 65
    }
  }
}
```

---

## 🎮 Simulations

### Run Simulation
```http
POST /api/simulations
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "infrastructure_impact",
  "parameters": {
    "infrastructure_type": "streetlight",
    "location": [12.9716, 77.5946],
    "radius": 500
  }
}

Response:
{
  "success": true,
  "data": {
    "simulation_id": "SIM001",
    "results": {
      "safety_score_before": 65,
      "safety_score_after": 82,
      "improvement": 17
    }
  }
}
```

---

## 📈 Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔒 Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer your-jwt-token-here
```

---

## 🌐 WebSocket Events

### Connect to WebSocket
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Listen for new reports
socket.on('new_report', (data) => {
  console.log('New report:', data);
});

// Listen for status updates
socket.on('status_update', (data) => {
  console.log('Status updated:', data);
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

---

## 📝 Rate Limiting

API requests are rate-limited to prevent abuse:
- **Authenticated requests**: 100 requests per 15 minutes
- **Unauthenticated requests**: 20 requests per 15 minutes

---

## 🧪 Testing with cURL

### Example: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@winguard.com","password":"citizen123"}'
```

### Example: Get Reports
```bash
curl -X GET http://localhost:3000/api/reports/all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Example: Create Report
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Pothole",
    "severity": 8,
    "description": "Large pothole",
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```

---

## 📚 Additional Resources

- [Installation Guide](./INSTALLATION_GUIDE.md)
- [Features Documentation](./FEATURES_IMPLEMENTATION.md)
- [README](./README.md)

---

**Last Updated**: May 28, 2026
**API Version**: 1.0.0
