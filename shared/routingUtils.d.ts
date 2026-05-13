// Type declarations for routingUtils.js

export interface Location {
  lat: number;
  lng: number;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  location: Location;
  type: string;
}

export interface RouteResult {
  path: Location[];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteStats {
  totalDistance: number;
  estimatedMinutes: number;
  avgSafetyScore: number;
  hazardsNearRoute: number;
  criticalHazards: number;
  safetyRating: string;
}

export function calculateGuardianPathWithRoads(
  start: Location,
  end: Location,
  hazards: any[],
  safeHavens: any[]
): Promise<RouteResult>;

export function calculateRouteStats(path: Location[], issues: any[]): RouteStats;

export function calculateDistance(point1: Location, point2: Location): number;
