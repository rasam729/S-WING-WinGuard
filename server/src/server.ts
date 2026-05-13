/**
 * WinGuard Backend Server
 * Main entry point for the Express server with Socket.io
 */

// IMPORTANT: Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';

// When running as workspace, cwd is the server directory, so go up one level
const envPath = path.resolve(process.cwd(), '../.env');
console.log('🔍 Loading .env from:', envPath);
console.log('🔍 process.cwd():', process.cwd());
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.log('⚠️  Error loading .env:', result.error.message);
} else {
  console.log('✅ .env loaded successfully');
}

// Now import everything else
import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { connectPostgres } from './config/postgres';
import { initializeSocketIO } from './socket/socketHandler';
import authRoutes from './routes/authRoutes';
import mapRoutes from './routes/mapRoutes';
import reportsRoutes, { setSocketIO } from './routes/reportsRoutes';
import enhancedReportsRoutes from './routes/enhancedReportsRoutes';
import reportsPostgres from './routes/reportsPostgres';
import routesRoutes from './routes/routesRoutes';
import budgetRoutes from './routes/budgetRoutes';
import routeRoutes from './routes/routeRoutes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000'),
  pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '5000')
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/reports', reportsPostgres); // PostgreSQL-based reports
app.use('/api/routes', routesRoutes);
app.use('/api', budgetRoutes);
app.use('/api/routes', routeRoutes);

// Import new routes
import simulationRoutes from './routes/simulationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationsRoutes from './routes/notificationsRoutes';
import issuesRoutes from './routes/issues';
import safetyScoreRoutes from './routes/safetyScoreRoutes';
import budgetTrackingRoutes from './routes/budgetTrackingRoutes';

app.use('/api', simulationRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', notificationsRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api', safetyScoreRoutes);
app.use('/api', budgetTrackingRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Socket.IO
initializeSocketIO(io);

// Start Server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to PostgreSQL with PostGIS
    await connectPostgres();
    console.log('✓ Database connected');

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ WebSocket server ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();

export { app, io };
