/**
 * Shared TypeScript Type Definitions for WinGuard Platform
 */

// Geographic Types
export interface LatLng {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// User Types
export type UserRole = 'citizen' | 'official';

export interface User {
  _id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthToken {
  token: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
  };
}

// Issue Types
export type IssueType = 'pothole' | 'streetlight' | 'crime' | 'other';
export type IssueStatus = 'reported' | 'resolved';

export interface SafetyIssue {
  _id: string;
  issueType: IssueType;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  photoUrl: string;
  photoMetadata: {
    capturedAt: Date;
    exifLocation: LatLng | null;
  };
  severity: {
    userInput: number; // 1-10
    calculated: number; // 0-100
    factors: {
      issueTypeWeight: number;
      timeOfDayWeight: number;
      proximityToCrimeWeight: number;
    };
  };
  status: IssueStatus;
  reportedBy: string; // User ID
  reportedAt: Date;
  resolvedBy: string | null; // User ID
  resolvedAt: Date | null;
}

// Infrastructure Types
export type InfrastructureType = 'police_booth' | 'streetlight' | 'hospital' | 'pothole';
export type InfrastructureStatus = 'functional' | 'broken' | 'simulated';

export interface Infrastructure {
  _id: string;
  type: InfrastructureType;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: InfrastructureStatus;
  metadata: {
    name?: string; // For police booths, hospitals
    brightness?: number; // For streetlights (lumens)
    lastMaintenance?: Date;
  };
  createdAt: Date;
  createdBy: string | null; // User ID (null for mock data)
}

// Route Types
export type RouteType = 'safe' | 'fast';

export interface Waypoint {
  type: 'police_booth' | 'streetlight';
  location: LatLng;
}

export interface Route {
  coordinates: LatLng[];
  distance: number; // meters
  estimatedTime: number; // seconds
  safetyScore: number | null; // 0-100 (safe routes only)
  waypoints: Waypoint[];
}

// Heatmap Types
export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1
}

// Simulation Types
export type SimulationAction = 'add' | 'remove' | 'modify';

export interface SimulationChange {
  action: SimulationAction;
  infrastructureType: InfrastructureType;
  location: LatLng;
  metadata?: Record<string, any>;
}

export interface PredictedImpact {
  darkSpotReduction: number; // percentage
  crimeZoneReduction: number; // percentage
  affectedRoutes: number; // count
}

export interface Simulation {
  _id: string;
  officialId: string; // User ID
  changes: SimulationChange[];
  predictedImpact: PredictedImpact;
  createdAt: Date;
  expiresAt: Date;
}

// Configuration Types
export interface SeverityWeights {
  userInput: number;
  issueType: number;
  timeOfDay: number;
  crimeProximity: number;
}

export interface RoutingWeights {
  policeBoothRadius: number;
  streetlightRadius: number;
  darkSpotPenalty: number;
  crimeZonePenalty: number;
}

export interface HeatmapConfig {
  darkSpotThreshold: number;
  crimeZoneThreshold: number;
  heatmapRadius: number;
}

export interface SystemConfiguration {
  _id: string;
  coordinateCenter: LatLng;
  operationalRadius: number;
  severityWeights: SeverityWeights;
  routingWeights: RoutingWeights;
  heatmapConfig: HeatmapConfig;
}

// API Request/Response Types
export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
  };
}

export interface CreateReportRequest {
  photo: File;
  issueType: IssueType;
  description: string;
  userSeverity: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface CreateReportResponse {
  issueId: string;
  calculatedSeverity: number;
  photoUrl: string;
}

export interface GetReportsQuery {
  resolved?: boolean;
  minSeverity?: number;
  limit?: number;
  offset?: number;
}

export interface GetReportsResponse {
  issues: SafetyIssue[];
  total: number;
  hasMore: boolean;
}

export interface CalculateRouteRequest {
  origin: LatLng;
  destination: LatLng;
  routeType: RouteType;
}

export interface CalculateRouteResponse {
  route: Route;
}

export interface PreviewSimulationRequest {
  changes: SimulationChange[];
}

export interface PreviewSimulationResponse {
  simulationId: string;
  predictedImpact: PredictedImpact;
  updatedHeatmaps: {
    darkSpots: HeatmapPoint[];
    crimeZones: HeatmapPoint[];
  };
}

export interface InfrastructureStatsResponse {
  totalIssues: number;
  resolvedIssues: number;
  policeBooths: number;
  streetlights: number;
  averageSeverity: number;
  issuesByDay: { date: string; count: number }[];
}

// WebSocket Event Types
export interface WSAuthenticatePayload {
  token: string;
}

export interface WSSubscribePayload {
  role: UserRole;
}

export interface WSNewIssuePayload extends SafetyIssue {}

export interface WSIssueResolvedPayload {
  issueId: string;
  resolvedAt: string;
}

export interface WSInfrastructureUpdatedPayload extends Infrastructure {}

export interface WSConnectionStatusPayload {
  connected: boolean;
  latency: number;
}

// Error Types
export interface APIError {
  error: string;
  code: string;
  details?: Record<string, any>;
}

export interface ValidationError extends APIError {
  fields: Record<string, string>;
}

// Geolocation Metadata
export interface GeoMetadata {
  location: LatLng | null;
  timestamp: Date;
  accuracy?: number;
}

// Map Marker Types
export interface MarkerData {
  id: string;
  type: 'issue' | 'infrastructure';
  position: LatLng;
  data: SafetyIssue | Infrastructure;
}

// Statistics Types
export interface InfrastructureStatistics {
  totalIssues: number;
  resolvedIssues: number;
  policeBooths: number;
  streetlights: number;
  functionalLights: number;
  brokenLights: number;
  averageSeverity: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
}

// Pagination Types
export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Filter Types
export interface IssueFilters {
  status?: IssueStatus;
  issueType?: IssueType;
  minSeverity?: number;
  maxSeverity?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface InfrastructureFilters {
  type?: InfrastructureType;
  status?: InfrastructureStatus;
  bounds?: BoundingBox;
}
