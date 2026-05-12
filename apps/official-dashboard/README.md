# WinGuard Official Dashboard

Desktop web application for city officials to monitor safety data, visualize digital twin, and simulate infrastructure changes.

## Features

- 🗺️ Digital twin visualization with Leaflet.js
- 📊 Real-time statistics and analytics
- 🔮 Infrastructure simulation tools
- 🎯 Heatmap overlays (dark spots, crime zones)
- 🔄 Real-time updates via WebSocket
- 🔐 JWT authentication (Official role only)
- 📈 Recharts for data visualization
- 🎨 Tailwind CSS with shadcn/ui components

## Tech Stack

- React 18.3.1
- TypeScript
- Vite 6.3.5
- Leaflet.js 1.9.4
- Socket.io-client
- Zustand (state management)
- Recharts 2.15.2
- Radix UI components
- Tailwind CSS 4.1.12
- Axios

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file:

```bash
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## Project Structure

```
src/
├── components/       # Reusable React components
├── pages/           # Page components
├── services/        # API and WebSocket services
├── store/           # Zustand state management
├── styles/          # Global styles
└── main.tsx         # Application entry point
```

## Key Features

### Digital Twin Visualization
- Real-time map of city infrastructure
- Safety issue markers color-coded by severity
- Police booths, streetlights, hospitals
- Heatmap overlays for dark spots and crime zones

### Infrastructure Simulation
- Preview infrastructure changes before implementation
- Add police booths, repair streetlights, fix potholes
- Calculate predicted impact on safety metrics
- Commit or discard simulated changes

### Statistics Dashboard
- Total issues (reported vs resolved)
- Infrastructure counts
- Average severity scores
- 30-day trend charts

### Real-Time Updates
- WebSocket connection for live data
- Instant notifications of new citizen reports
- Real-time infrastructure status changes

## Key Components

- **LoginPage** - Official authentication
- **DashboardPage** - Main dashboard with digital twin
- **SimulationsPage** - Infrastructure simulation tools
- **ProtectedRoute** - Route guard for official users

## State Management

### Auth Store
- User authentication state
- JWT token management
- Role-based access control

### Simulation Store
- Pending infrastructure changes
- Predicted impact calculations
- Simulation commit/discard logic

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Building for Production

```bash
# Build
npm run build

# The dist/ folder will contain the production build
```

## Docker

```bash
# Build image
docker build -t winguard-official-dashboard .

# Run container
docker run -p 5174:80 winguard-official-dashboard
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Integration with Backend

The dashboard connects to the WinGuard backend server for:
- Authentication (JWT)
- Safety issue data
- Infrastructure data
- Real-time WebSocket updates
- Simulation API endpoints

## License

[Your License]
