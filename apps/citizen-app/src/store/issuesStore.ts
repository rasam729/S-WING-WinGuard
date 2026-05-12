// Shared issues store for citizen app - synced with dashboard mock data
export interface Issue {
  id: number;
  type: 'pothole' | 'streetlight' | 'police_booth';
  latitude: number;
  longitude: number;
  status: 'critical' | 'in_progress' | 'resolved';
  description: string;
  reportedAt: string;
  severity: number;
}

// Same mock data as dashboard for consistency
export const mockIssues: Issue[] = [
  { id: 1, type: 'pothole', latitude: 12.9759, longitude: 77.6061, status: 'critical', description: 'Severe pothole on MG Road', reportedAt: '2 hours ago', severity: 9 },
  { id: 2, type: 'streetlight', latitude: 12.9716, longitude: 77.6412, status: 'critical', description: 'Broken streetlight in Indiranagar', reportedAt: '5 hours ago', severity: 8 },
  { id: 3, type: 'pothole', latitude: 12.9350, longitude: 77.6200, status: 'in_progress', description: 'Pothole repair in Koramangala', reportedAt: '1 day ago', severity: 7 },
  { id: 4, type: 'streetlight', latitude: 12.9550, longitude: 77.6100, status: 'resolved', description: 'Streetlight repaired in Whitefield', reportedAt: '3 days ago', severity: 6 },
  { id: 5, type: 'pothole', latitude: 12.9650, longitude: 77.5850, status: 'critical', description: 'Large pothole near Cubbon Park', reportedAt: '1 hour ago', severity: 10 },
  { id: 6, type: 'pothole', latitude: 12.9800, longitude: 77.6300, status: 'critical', description: 'Multiple potholes on Outer Ring Road', reportedAt: '3 hours ago', severity: 9 },
  { id: 7, type: 'streetlight', latitude: 12.9400, longitude: 77.6150, status: 'in_progress', description: 'Streetlight flickering in BTM Layout', reportedAt: '6 hours ago', severity: 5 },
  { id: 8, type: 'police_booth', latitude: 12.9500, longitude: 77.6000, status: 'resolved', description: 'New police booth installed in HSR Layout', reportedAt: '1 week ago', severity: 0 },
  { id: 9, type: 'pothole', latitude: 12.9280, longitude: 77.6270, status: 'in_progress', description: 'Pothole on Hosur Road', reportedAt: '12 hours ago', severity: 8 },
  { id: 10, type: 'streetlight', latitude: 12.9900, longitude: 77.5900, status: 'critical', description: 'Streetlight not working in Yelahanka', reportedAt: '4 hours ago', severity: 7 },
  { id: 11, type: 'pothole', latitude: 12.9150, longitude: 77.6400, status: 'resolved', description: 'Pothole fixed on Bannerghatta Road', reportedAt: '2 days ago', severity: 6 },
  { id: 12, type: 'streetlight', latitude: 12.9600, longitude: 77.6500, status: 'resolved', description: 'Streetlight replaced in Marathahalli', reportedAt: '5 days ago', severity: 5 },
  { id: 13, type: 'pothole', latitude: 12.9450, longitude: 77.5750, status: 'critical', description: 'Deep pothole on Mysore Road', reportedAt: '30 minutes ago', severity: 10 },
  { id: 14, type: 'police_booth', latitude: 12.9700, longitude: 77.6200, status: 'in_progress', description: 'Police booth under construction in Jayanagar', reportedAt: '2 weeks ago', severity: 0 },
  { id: 15, type: 'pothole', latitude: 12.9550, longitude: 77.6350, status: 'in_progress', description: 'Pothole repair on Airport Road', reportedAt: '8 hours ago', severity: 7 },
];

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get issues near a location
export const getIssuesNearLocation = (
  location: { lat: number; lng: number },
  radiusKm: number = 5
): Issue[] => {
  return mockIssues.filter(issue => {
    const distance = calculateDistance(location, { lat: issue.latitude, lng: issue.longitude });
    return distance <= radiusKm;
  });
};

// Get active (non-resolved) issues
export const getActiveIssues = (): Issue[] => {
  return mockIssues.filter(issue => issue.status !== 'resolved');
};

// Get critical issues
export const getCriticalIssues = (): Issue[] => {
  return mockIssues.filter(issue => issue.status === 'critical');
};

// Calculate safety score for a location based on nearby issues
export const calculateSafetyScore = (
  location: { lat: number; lng: number },
  radiusKm: number = 1
): number => {
  const nearbyIssues = getIssuesNearLocation(location, radiusKm);
  const activeIssues = nearbyIssues.filter(i => i.status !== 'resolved');
  
  if (activeIssues.length === 0) return 100;
  
  // Calculate score based on number and severity of issues
  let score = 100;
  activeIssues.forEach(issue => {
    const distance = calculateDistance(location, { lat: issue.latitude, lng: issue.longitude });
    const proximityFactor = Math.max(0, 1 - (distance / radiusKm));
    const severityPenalty = (issue.severity / 10) * 20 * proximityFactor;
    score -= severityPenalty;
  });
  
  return Math.max(0, Math.min(100, score));
};

// Get stats for dashboard
export const getIssueStats = () => {
  return {
    total: mockIssues.length,
    critical: mockIssues.filter(i => i.status === 'critical').length,
    inProgress: mockIssues.filter(i => i.status === 'in_progress').length,
    resolved: mockIssues.filter(i => i.status === 'resolved').length,
    potholes: mockIssues.filter(i => i.type === 'pothole').length,
    streetlights: mockIssues.filter(i => i.type === 'streetlight').length,
    policeBooths: mockIssues.filter(i => i.type === 'police_booth').length,
  };
};
