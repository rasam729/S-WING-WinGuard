/**
 * Safety Score Service
 * Calculates safety scores for areas based on:
 * - Crime rate data (mock data for Bengaluru)
 * - Infrastructure (streetlights, police booths)
 * - Reported issues (potholes, broken lights)
 * - Time of day
 */

import pool from '../config/postgres';

// Mock crime data for Bengaluru areas (crimes per 1000 people per year)
export const BENGALURU_CRIME_DATA = {
  // High crime areas
  'Koramangala': { crimeRate: 45.2, area: 'Koramangala', zone: 'South' },
  'Indiranagar': { crimeRate: 38.7, area: 'Indiranagar', zone: 'East' },
  'Whitefield': { crimeRate: 42.1, area: 'Whitefield', zone: 'East' },
  'Electronic City': { crimeRate: 35.8, area: 'Electronic City', zone: 'South' },
  
  // Medium crime areas
  'Jayanagar': { crimeRate: 28.5, area: 'Jayanagar', zone: 'South' },
  'Malleshwaram': { crimeRate: 25.3, area: 'Malleshwaram', zone: 'North' },
  'Rajajinagar': { crimeRate: 27.9, area: 'Rajajinagar', zone: 'West' },
  'BTM Layout': { crimeRate: 31.2, area: 'BTM Layout', zone: 'South' },
  
  // Low crime areas
  'Basavanagudi': { crimeRate: 18.4, area: 'Basavanagudi', zone: 'South' },
  'Vijayanagar': { crimeRate: 20.1, area: 'Vijayanagar', zone: 'West' },
  'Yelahanka': { crimeRate: 22.7, area: 'Yelahanka', zone: 'North' },
  'JP Nagar': { crimeRate: 24.3, area: 'JP Nagar', zone: 'South' }
};

// Bengaluru area coordinates (approximate centers)
export const BENGALURU_AREA_COORDS = {
  'Koramangala': { lat: 12.9352, lng: 77.6245 },
  'Indiranagar': { lat: 12.9716, lng: 77.6412 },
  'Whitefield': { lat: 12.9698, lng: 77.7499 },
  'Electronic City': { lat: 12.8456, lng: 77.6603 },
  'Jayanagar': { lat: 12.9250, lng: 77.5838 },
  'Malleshwaram': { lat: 13.0039, lng: 77.5710 },
  'Rajajinagar': { lat: 12.9916, lng: 77.5520 },
  'BTM Layout': { lat: 12.9165, lng: 77.6101 },
  'Basavanagudi': { lat: 12.9423, lng: 77.5742 },
  'Vijayanagar': { lat: 12.9698, lng: 77.5219 },
  'Yelahanka': { lat: 13.1007, lng: 77.5963 },
  'JP Nagar': { lat: 12.9081, lng: 77.5855 }
};

interface SafetyScoreFactors {
  crimeScore: number;
  infrastructureScore: number;
  issueScore: number;
  timeScore: number;
  overallScore: number;
  grade: string;
  factors: {
    crimeRate: number;
    streetlights: number;
    policeBooths: number;
    activeIssues: number;
    resolvedIssues: number;
    isNighttime: boolean;
  };
}

/**
 * Calculate haversine distance between two points
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Find nearest area and get crime rate
 */
function getCrimeRateForLocation(lat: number, lng: number): { area: string; crimeRate: number } {
  let nearestArea = 'Koramangala';
  let minDistance = Infinity;

  for (const [area, coords] of Object.entries(BENGALURU_AREA_COORDS)) {
    const distance = haversineDistance(lat, lng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestArea = area;
    }
  }

  return {
    area: nearestArea,
    crimeRate: BENGALURU_CRIME_DATA[nearestArea]?.crimeRate || 30.0
  };
}

/**
 * Calculate safety score for a specific location
 */
export async function calculateSafetyScore(
  latitude: number,
  longitude: number,
  radius: number = 1000,
  timeOfDay?: Date
): Promise<SafetyScoreFactors> {
  const time = timeOfDay || new Date();
  const hour = time.getHours();
  const isNighttime = hour >= 20 || hour <= 6;

  // 1. Crime Score (40% weight)
  const { area, crimeRate } = getCrimeRateForLocation(latitude, longitude);
  // Normalize: 0 crimes = 100, 50+ crimes = 0
  const crimeScore = Math.max(0, Math.min(100, 100 - (crimeRate * 2)));

  // 2. Infrastructure Score (30% weight)
  const infrastructureQuery = await pool.query(`
    SELECT 
      COUNT(CASE WHEN type = 'streetlight' AND status = 'functional' THEN 1 END) as functional_lights,
      COUNT(CASE WHEN type = 'streetlight' AND status = 'broken' THEN 1 END) as broken_lights,
      COUNT(CASE WHEN type = 'police_booth' THEN 1 END) as police_booths
    FROM infrastructure
    WHERE ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $3
    )
  `, [longitude, latitude, radius]);

  const infra = infrastructureQuery.rows[0];
  const functionalLights = parseInt(infra.functional_lights) || 0;
  const brokenLights = parseInt(infra.broken_lights) || 0;
  const policeBooths = parseInt(infra.police_booths) || 0;

  // Calculate infrastructure score
  const lightScore = Math.min(100, (functionalLights * 10) - (brokenLights * 5));
  const boothScore = Math.min(100, policeBooths * 20);
  const infrastructureScore = (lightScore * 0.7 + boothScore * 0.3);

  // 3. Issue Score (20% weight)
  const issuesQuery = await pool.query(`
    SELECT 
      COUNT(CASE WHEN status IN ('Report Received', 'In Progress') THEN 1 END) as active_issues,
      COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved_issues,
      AVG(CASE WHEN status IN ('Report Received', 'In Progress') THEN severity ELSE NULL END) as avg_severity
    FROM reports
    WHERE ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $3
    )
  `, [longitude, latitude, radius]);

  const issues = issuesQuery.rows[0];
  const activeIssues = parseInt(issues.active_issues) || 0;
  const resolvedIssues = parseInt(issues.resolved_issues) || 0;
  const avgSeverity = parseFloat(issues.avg_severity) || 0;

  // Calculate issue score (fewer active issues = higher score)
  const issueScore = Math.max(0, 100 - (activeIssues * 10) - (avgSeverity * 2));

  // 4. Time Score (10% weight)
  // Nighttime reduces safety score
  const timeScore = isNighttime ? 60 : 100;

  // Calculate weighted overall score
  const overallScore = Math.round(
    (crimeScore * 0.40) +
    (infrastructureScore * 0.30) +
    (issueScore * 0.20) +
    (timeScore * 0.10)
  );

  // Determine grade
  let grade = 'F';
  if (overallScore >= 90) grade = 'A+';
  else if (overallScore >= 80) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 60) grade = 'C';
  else if (overallScore >= 50) grade = 'D';

  return {
    crimeScore: Math.round(crimeScore),
    infrastructureScore: Math.round(infrastructureScore),
    issueScore: Math.round(issueScore),
    timeScore,
    overallScore,
    grade,
    factors: {
      crimeRate,
      streetlights: functionalLights,
      policeBooths,
      activeIssues,
      resolvedIssues,
      isNighttime
    }
  };
}

/**
 * Calculate how safety score changes with infrastructure improvements
 */
export async function simulateInfrastructureImpact(
  latitude: number,
  longitude: number,
  radius: number = 1000,
  changes: {
    addStreetlights?: number;
    addPoliceBooths?: number;
    fixIssues?: number;
  }
): Promise<{
  before: SafetyScoreFactors;
  after: SafetyScoreFactors;
  improvement: number;
  recommendations: string[];
}> {
  // Get current score
  const before = await calculateSafetyScore(latitude, longitude, radius);

  // Simulate changes
  const { area, crimeRate } = getCrimeRateForLocation(latitude, longitude);
  const crimeScore = Math.max(0, Math.min(100, 100 - (crimeRate * 2)));

  // Get current infrastructure
  const infrastructureQuery = await pool.query(`
    SELECT 
      COUNT(CASE WHEN type = 'streetlight' AND status = 'functional' THEN 1 END) as functional_lights,
      COUNT(CASE WHEN type = 'police_booth' THEN 1 END) as police_booths
    FROM infrastructure
    WHERE ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $3
    )
  `, [longitude, latitude, radius]);

  const infra = infrastructureQuery.rows[0];
  const currentLights = parseInt(infra.functional_lights) || 0;
  const currentBooths = parseInt(infra.police_booths) || 0;

  // Apply simulated changes
  const newLights = currentLights + (changes.addStreetlights || 0);
  const newBooths = currentBooths + (changes.addPoliceBooths || 0);

  const lightScore = Math.min(100, (newLights * 10));
  const boothScore = Math.min(100, newBooths * 20);
  const newInfrastructureScore = (lightScore * 0.7 + boothScore * 0.3);

  // Get current issues
  const issuesQuery = await pool.query(`
    SELECT 
      COUNT(CASE WHEN status IN ('Report Received', 'In Progress') THEN 1 END) as active_issues
    FROM reports
    WHERE ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $3
    )
  `, [longitude, latitude, radius]);

  const activeIssues = parseInt(issuesQuery.rows[0].active_issues) || 0;
  const newActiveIssues = Math.max(0, activeIssues - (changes.fixIssues || 0));
  const newIssueScore = Math.max(0, 100 - (newActiveIssues * 10));

  const hour = new Date().getHours();
  const isNighttime = hour >= 20 || hour <= 6;
  const timeScore = isNighttime ? 60 : 100;

  const newOverallScore = Math.round(
    (crimeScore * 0.40) +
    (newInfrastructureScore * 0.30) +
    (newIssueScore * 0.20) +
    (timeScore * 0.10)
  );

  let grade = 'F';
  if (newOverallScore >= 90) grade = 'A+';
  else if (newOverallScore >= 80) grade = 'A';
  else if (newOverallScore >= 70) grade = 'B';
  else if (newOverallScore >= 60) grade = 'C';
  else if (newOverallScore >= 50) grade = 'D';

  const after: SafetyScoreFactors = {
    crimeScore: Math.round(crimeScore),
    infrastructureScore: Math.round(newInfrastructureScore),
    issueScore: Math.round(newIssueScore),
    timeScore,
    overallScore: newOverallScore,
    grade,
    factors: {
      crimeRate,
      streetlights: newLights,
      policeBooths: newBooths,
      activeIssues: newActiveIssues,
      resolvedIssues: before.factors.resolvedIssues,
      isNighttime
    }
  };

  // Generate recommendations
  const recommendations: string[] = [];
  if (newInfrastructureScore < 70) {
    recommendations.push(`Add ${Math.ceil((70 - newInfrastructureScore) / 7)} more streetlights to improve infrastructure score`);
  }
  if (newBooths < 2) {
    recommendations.push('Install at least 2 police booths in this area for better security');
  }
  if (newActiveIssues > 5) {
    recommendations.push(`Resolve ${newActiveIssues - 5} pending issues to improve safety perception`);
  }
  if (crimeScore < 60) {
    recommendations.push('High crime area - consider increased police patrolling');
  }

  return {
    before,
    after,
    improvement: newOverallScore - before.overallScore,
    recommendations
  };
}

/**
 * Get safety scores for all Bengaluru areas
 */
export async function getAllAreaScores(): Promise<any[]> {
  const scores = [];

  for (const [area, coords] of Object.entries(BENGALURU_AREA_COORDS)) {
    const score = await calculateSafetyScore(coords.lat, coords.lng, 2000);
    scores.push({
      area,
      ...coords,
      ...score,
      crimeData: BENGALURU_CRIME_DATA[area]
    });
  }

  return scores.sort((a, b) => b.overallScore - a.overallScore);
}

export default {
  calculateSafetyScore,
  simulateInfrastructureImpact,
  getAllAreaScores,
  BENGALURU_CRIME_DATA,
  BENGALURU_AREA_COORDS
};
