/**
 * Type declarations for safety logic
 */

export interface Point {
  lat: number;
  lng: number;
}

export interface Infrastructure {
  type: string;
  status: string;
  location: Point;
}

export interface HeatmapPoint extends Point {
  intensity: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface SeverityWeights {
  USER_INPUT: number;
  ISSUE_TYPE: number;
  TIME_OF_DAY: number;
  CRIME_PROXIMITY: number;
}

export interface RoutingWeights {
  POLICE_BOOTH_RADIUS: number;
  STREETLIGHT_RADIUS: number;
  DARK_SPOT_PENALTY: number;
  CRIME_ZONE_PENALTY: number;
}

export function haversineDistance(p1: Point, p2: Point): number;

export function isWithinOperationalRadius(
  point: Point,
  center: Point,
  radius: number
): boolean;

export function isValidCoordinate(point: Point): boolean;

export function calculateSeverityScore(
  userInput: number,
  issueType: string,
  timestamp: Date,
  location: Point,
  crimeZones?: Point[],
  weights?: SeverityWeights
): number;

export function findNearestPoint(target: Point, points: Point[]): Point | null;

export function calculateRouteWeight(
  node: Point,
  infrastructure: Infrastructure[],
  darkSpots: HeatmapPoint[],
  crimeZones: HeatmapPoint[],
  config?: RoutingWeights
): number;

export function findNearestInfrastructure(
  point: Point,
  infrastructure: Infrastructure[],
  type: string
): Infrastructure | null;

export function isInHeatmapZone(
  point: Point,
  heatmapPoints: HeatmapPoint[],
  threshold?: number
): boolean;

export function calculateBoundingBox(center: Point, radius: number): BoundingBox;

export function getSeverityCategory(score: number): 'low' | 'medium' | 'high';

export function getSeverityColor(score: number): string;

declare const _default: {
  haversineDistance: typeof haversineDistance;
  isWithinOperationalRadius: typeof isWithinOperationalRadius;
  isValidCoordinate: typeof isValidCoordinate;
  calculateSeverityScore: typeof calculateSeverityScore;
  findNearestPoint: typeof findNearestPoint;
  calculateRouteWeight: typeof calculateRouteWeight;
  findNearestInfrastructure: typeof findNearestInfrastructure;
  isInHeatmapZone: typeof isInHeatmapZone;
  calculateBoundingBox: typeof calculateBoundingBox;
  getSeverityCategory: typeof getSeverityCategory;
  getSeverityColor: typeof getSeverityColor;
};

export default _default;
