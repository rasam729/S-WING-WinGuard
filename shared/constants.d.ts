/**
 * Type declarations for shared constants
 */

export const ISSUE_TYPES: {
  POTHOLE: 'pothole';
  STREETLIGHT: 'streetlight';
  CRIME: 'crime';
  OTHER: 'other';
};

export const ISSUE_TYPE_WEIGHTS: {
  [key: string]: number;
};

export const INFRASTRUCTURE_TYPES: {
  POLICE_BOOTH: 'police_booth';
  STREETLIGHT: 'streetlight';
  HOSPITAL: 'hospital';
  POTHOLE: 'pothole';
};

export const INFRASTRUCTURE_STATUS: {
  FUNCTIONAL: 'functional';
  BROKEN: 'broken';
  SIMULATED: 'simulated';
};

export const ISSUE_STATUS: {
  REPORTED: 'reported';
  RESOLVED: 'resolved';
};

export const USER_ROLES: {
  CITIZEN: 'citizen';
  OFFICIAL: 'official';
};

export const ROUTE_TYPES: {
  SAFE: 'safe';
  FAST: 'fast';
};

export const SEVERITY_THRESHOLDS: {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
};

export const DEFAULT_CONFIG: {
  OPERATIONAL_RADIUS: number;
  COORDINATE_CENTER: {
    LAT: number;
    LNG: number;
  };
  SEVERITY_WEIGHTS: {
    USER_INPUT: number;
    ISSUE_TYPE: number;
    TIME_OF_DAY: number;
    CRIME_PROXIMITY: number;
  };
  ROUTING_WEIGHTS: {
    POLICE_BOOTH_RADIUS: number;
    STREETLIGHT_RADIUS: number;
    DARK_SPOT_PENALTY: number;
    CRIME_ZONE_PENALTY: number;
  };
  HEATMAP_CONFIG: {
    DARK_SPOT_THRESHOLD: number;
    CRIME_ZONE_THRESHOLD: number;
    HEATMAP_RADIUS: number;
  };
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string[];
  WS_PING_INTERVAL: number;
  WS_PING_TIMEOUT: number;
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX_REQUESTS: number;
};

export const TIME_THRESHOLDS: {
  NIGHT_START: number;
  NIGHT_END: number;
};

export const WS_EVENTS: {
  AUTHENTICATE: 'authenticate';
  SUBSCRIBE_UPDATES: 'subscribe_updates';
  AUTHENTICATED: 'authenticated';
  AUTH_ERROR: 'auth_error';
  SUBSCRIBED: 'subscribed';
  NEW_ISSUE: 'new_issue';
  ISSUE_RESOLVED: 'issue_resolved';
  INFRASTRUCTURE_UPDATED: 'infrastructure_updated';
  CONNECTION_STATUS: 'connection_status';
};

export const ERROR_CODES: {
  AUTH_REQUIRED: 'AUTH_REQUIRED';
  FORBIDDEN: 'FORBIDDEN';
  VALIDATION_ERROR: 'VALIDATION_ERROR';
  NOT_FOUND: 'NOT_FOUND';
  INTERNAL_ERROR: 'INTERNAL_ERROR';
  RATE_LIMIT: 'RATE_LIMIT';
  OUTSIDE_RADIUS: 'OUTSIDE_RADIUS';
  FILE_TOO_LARGE: 'FILE_TOO_LARGE';
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE';
};

export const HTTP_STATUS: {
  OK: number;
  CREATED: number;
  BAD_REQUEST: number;
  UNAUTHORIZED: number;
  FORBIDDEN: number;
  NOT_FOUND: number;
  TOO_MANY_REQUESTS: number;
  INTERNAL_SERVER_ERROR: number;
};

export const PAGINATION: {
  DEFAULT_LIMIT: number;
  MAX_LIMIT: number;
};

export const MAP_CONFIG: {
  DEFAULT_ZOOM: number;
  MIN_ZOOM: number;
  MAX_ZOOM: number;
  TILE_LAYER: string;
  ATTRIBUTION: string;
};

export const MARKER_COLORS: {
  SEVERITY_HIGH: string;
  SEVERITY_MEDIUM: string;
  SEVERITY_LOW: string;
  POLICE_BOOTH: string;
  STREETLIGHT: string;
  HOSPITAL: string;
  SIMULATED: string;
};

export const ROUTE_COLORS: {
  SAFE: string;
  FAST: string;
};

export const VALIDATION: {
  LATITUDE_MIN: number;
  LATITUDE_MAX: number;
  LONGITUDE_MIN: number;
  LONGITUDE_MAX: number;
  USER_SEVERITY_MIN: number;
  USER_SEVERITY_MAX: number;
  CALCULATED_SEVERITY_MIN: number;
  CALCULATED_SEVERITY_MAX: number;
  USERNAME_MIN_LENGTH: number;
  USERNAME_MAX_LENGTH: number;
  PASSWORD_MIN_LENGTH: number;
  DESCRIPTION_MAX_LENGTH: number;
};

declare const _default: {
  ISSUE_TYPES: typeof ISSUE_TYPES;
  ISSUE_TYPE_WEIGHTS: typeof ISSUE_TYPE_WEIGHTS;
  INFRASTRUCTURE_TYPES: typeof INFRASTRUCTURE_TYPES;
  INFRASTRUCTURE_STATUS: typeof INFRASTRUCTURE_STATUS;
  ISSUE_STATUS: typeof ISSUE_STATUS;
  USER_ROLES: typeof USER_ROLES;
  ROUTE_TYPES: typeof ROUTE_TYPES;
  SEVERITY_THRESHOLDS: typeof SEVERITY_THRESHOLDS;
  DEFAULT_CONFIG: typeof DEFAULT_CONFIG;
  TIME_THRESHOLDS: typeof TIME_THRESHOLDS;
  WS_EVENTS: typeof WS_EVENTS;
  ERROR_CODES: typeof ERROR_CODES;
  HTTP_STATUS: typeof HTTP_STATUS;
  PAGINATION: typeof PAGINATION;
  MAP_CONFIG: typeof MAP_CONFIG;
  MARKER_COLORS: typeof MARKER_COLORS;
  ROUTE_COLORS: typeof ROUTE_COLORS;
  VALIDATION: typeof VALIDATION;
};

export default _default;
