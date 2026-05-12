# WinGuard Backend Server

Node.js/Express backend server with Socket.io for real-time communication.

## Features

- RESTful API for safety issue reporting and management
- WebSocket support for real-time updates
- JWT-based authentication with role-based access control
- MongoDB for data persistence
- File upload handling for photo evidence
- Geographic boundary validation
- Severity score calculation
- Route calculation (safe and fast modes)
- Infrastructure simulation tools

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/validate` - Validate JWT token

### Reports
- `POST /api/reports` - Create safety issue report (Citizen only)
- `GET /api/reports` - Get all reports with filters
- `PATCH /api/reports/:id/resolve` - Mark issue as resolved (Official only)

### Routes
- `POST /api/routes/calculate` - Calculate safe or fast route (Citizen only)

### Simulations
- `POST /api/simulations/preview` - Preview infrastructure changes (Official only)
- `POST /api/simulations/:id/commit` - Commit simulation (Official only)
- `DELETE /api/simulations/:id` - Discard simulation (Official only)

### Infrastructure
- `GET /api/infrastructure` - Get all infrastructure
- `GET /api/infrastructure/stats` - Get statistics

## WebSocket Events

### Client → Server
- `authenticate` - Authenticate with JWT token
- `subscribe_updates` - Subscribe to role-specific updates

### Server → Client
- `authenticated` - Authentication successful
- `auth_error` - Authentication failed
- `subscribed` - Subscription successful
- `new_issue` - New safety issue reported (Officials only)
- `issue_resolved` - Issue marked as resolved (All clients)
- `infrastructure_updated` - Infrastructure changed (All clients)
- `connection_status` - Connection status update

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Environment Variables

See `.env.example` for required configuration.

## Database Models

- **User** - User accounts with roles
- **SafetyIssue** - Reported safety issues
- **Infrastructure** - City infrastructure (police booths, streetlights, etc.)
- **Simulation** - Temporary infrastructure change simulations
- **SystemConfig** - System-wide configuration (singleton)

## Testing

```bash
# Run all tests
npm test

# Run property-based tests
npm run test:properties

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```
