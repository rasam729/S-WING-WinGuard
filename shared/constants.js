/**
 * Shared Constants for WinGuard Platform
 * Contains POI definitions, configuration values, and enums
 */

// Issue Types
export const ISSUE_TYPES = {
  POTHOLE: 'pothole',
  STREETLIGHT: 'streetlight',
  CRIME: 'crime',
  OTHER: 'other'
};

// Issue Type Weights for Severity Calculation
export const ISSUE_TYPE_WEIGHTS = {
  [ISSUE_TYPES.CRIME]: 1.0,
  [ISSUE_TYPES.STREETLIGHT]: 0.8,
  [ISSUE_TYPES.POTHOLE]: 0.6,
  [ISSUE_TYPES.OTHER]: 0.4
};

// Infrastructure Types
export const INFRASTRUCTURE_TYPES = {
  POLICE_BOOTH: 'police_booth',
  STREETLIGHT: 'streetlight',
  HOSPITAL: 'hospital',
  POTHOLE: 'pothole'
};

// Infrastructure Status
export const INFRASTRUCTURE_STATUS = {
  FUNCTIONAL: 'functional',
  BROKEN: 'broken',
  SIMULATED: 'simulated'
};

// Issue Status
export const ISSUE_STATUS = {
  REPORTED: 'reported',
  RESOLVED: 'resolved'
};

// User Roles
export const USER_ROLES = {
  CITIZEN: 'citizen',
  OFFICIAL: 'official'
};

// Route Types
export const ROUTE_TYPES = {
  SAFE: 'safe',
  FAST: 'fast'
};

// Severity Thresholds
export const SEVERITY_THRESHOLDS = {
  LOW: 39,      // 0-39: Low severity (green)
  MEDIUM: 79,   // 40-79: Medium severity (yellow)
  HIGH: 100     // 80-100: High severity (red)
};

// Default Configuration Values
export const DEFAULT_CONFIG = {
  OPERATIONAL_RADIUS: 5000,  // 5km in meters
  COORDINATE_CENTER: {
    LAT: 40.7128,  // New York City
    LNG: -74.0060
  },
  
  // Severity Weights
  SEVERITY_WEIGHTS: {
    USER_INPUT: 0.4,
    ISSUE_TYPE: 0.3,
    TIME_OF_DAY: 0.2,
    CRIME_PROXIMITY: 0.1
  },
  
  // Routing Weights
  ROUTING_WEIGHTS: {
    POLICE_BOOTH_RADIUS: 100,      // meters
    STREETLIGHT_RADIUS: 50,        // meters
    DARK_SPOT_PENALTY: 2.0,        // multiplier
    CRIME_ZONE_PENALTY: 3.0        // multiplier
  },
  
  // Heatmap Configuration
  HEATMAP_CONFIG: {
    DARK_SPOT_THRESHOLD: 50,       // lumens
    CRIME_ZONE_THRESHOLD: 10,      // incidents per km²
    HEATMAP_RADIUS: 200            // meters
  },
  
  // File Upload
  MAX_FILE_SIZE: 5242880,          // 5MB in bytes
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  
  // WebSocket
  WS_PING_INTERVAL: 30000,         // 30 seconds
  WS_PING_TIMEOUT: 5000,           // 5 seconds
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 60000,        // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100
};

// Time of Day Thresholds
export const TIME_THRESHOLDS = {
  NIGHT_START: 20,  // 8 PM
  NIGHT_END: 6      // 6 AM
};

// WebSocket Events
export const WS_EVENTS = {
  // Client → Server
  AUTHENTICATE: 'authenticate',
  SUBSCRIBE_UPDATES: 'subscribe_updates',
  
  // Server → Client
  AUTHENTICATED: 'authenticated',
  AUTH_ERROR: 'auth_error',
  SUBSCRIBED: 'subscribed',
  NEW_ISSUE: 'new_issue',
  ISSUE_RESOLVED: 'issue_resolved',
  INFRASTRUCTURE_UPDATED: 'infrastructure_updated',
  CONNECTION_STATUS: 'connection_status'
};

// API Error Codes
export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  OUTSIDE_RADIUS: 'OUTSIDE_RADIUS',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE'
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18,
  TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Marker Colors
export const MARKER_COLORS = {
  SEVERITY_HIGH: '#ef4444',      // red-500
  SEVERITY_MEDIUM: '#eab308',    // yellow-500
  SEVERITY_LOW: '#22c55e',       // green-500
  POLICE_BOOTH: '#3b82f6',       // blue-500
  STREETLIGHT: '#f59e0b',        // amber-500
  HOSPITAL: '#ec4899',           // pink-500
  SIMULATED: '#8b5cf6'           // purple-500
};

// Route Colors
export const ROUTE_COLORS = {
  SAFE: '#22c55e',   // green-500
  FAST: '#3b82f6'    // blue-500
};

// Validation Patterns
export const VALIDATION = {
  LATITUDE_MIN: -90,
  LATITUDE_MAX: 90,
  LONGITUDE_MIN: -180,
  LONGITUDE_MAX: 180,
  USER_SEVERITY_MIN: 1,
  USER_SEVERITY_MAX: 10,
  CALCULATED_SEVERITY_MIN: 0,
  CALCULATED_SEVERITY_MAX: 100,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  DESCRIPTION_MAX_LENGTH: 1000
};

export default {
  ISSUE_TYPES,
  ISSUE_TYPE_WEIGHTS,
  INFRASTRUCTURE_TYPES,
  INFRASTRUCTURE_STATUS,
  ISSUE_STATUS,
  USER_ROLES,
  ROUTE_TYPES,
  SEVERITY_THRESHOLDS,
  DEFAULT_CONFIG,
  TIME_THRESHOLDS,
  WS_EVENTS,
  ERROR_CODES,
  HTTP_STATUS,
  PAGINATION,
  MAP_CONFIG,
  MARKER_COLORS,
  ROUTE_COLORS,
  VALIDATION
};
