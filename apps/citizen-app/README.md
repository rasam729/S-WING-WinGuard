# WinGuard Citizen App

Mobile-first Progressive Web Application for citizens to report safety issues and find safe routes.

## Features

- 📱 Mobile-first responsive design
- 📸 Photo upload with EXIF data extraction
- 📍 Geolocation-based reporting
- 🗺️ Interactive map with Leaflet.js
- 🔄 Real-time updates via WebSocket
- 🔐 JWT authentication
- 💾 Offline support (PWA)
- 🎨 Tailwind CSS styling

## Tech Stack

- React 18.3.1
- TypeScript
- Vite 6.3.5
- Leaflet.js 1.9.4
- Socket.io-client
- Zustand (state management)
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

## Key Components

- **LoginPage** - User authentication
- **HomePage** - Main dashboard with action cards
- **ReportIssuePage** - Safety issue reporting form
- **SafeRoutePage** - Route calculation and display
- **ProtectedRoute** - Route guard for authenticated users

## PWA Features

- Offline map tile caching
- Service worker for offline support
- Installable on mobile devices
- Push notifications (planned)

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
docker build -t winguard-citizen-app .

# Run container
docker run -p 5173:80 winguard-citizen-app
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

[Your License]
