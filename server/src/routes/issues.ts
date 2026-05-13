import { Router, Request, Response } from 'express';

const router = Router();

// Mock issues data that matches the dashboard store
// In a real app, this would come from a database
const mockIssues = [
  { id: 1, type: 'pothole', latitude: 12.9716, longitude: 77.5946, status: 'critical', description: 'Severe pothole on MG Road near Trinity Metro', reportedAt: '2 hours ago', severity: 9 },
  { id: 2, type: 'pothole', latitude: 12.9352, longitude: 77.6245, status: 'in_progress', description: 'Pothole on Hosur Road near Silk Board', reportedAt: '1 day ago', severity: 7 },
  { id: 3, type: 'pothole', latitude: 12.9698, longitude: 77.6450, status: 'critical', description: 'Large pothole on Old Airport Road', reportedAt: '1 hour ago', severity: 10 },
  { id: 4, type: 'pothole', latitude: 12.9279, longitude: 77.6271, status: 'in_progress', description: 'Pothole on Bannerghatta Road', reportedAt: '12 hours ago', severity: 8 },
  { id: 5, type: 'pothole', latitude: 12.9800, longitude: 77.6400, status: 'critical', description: 'Multiple potholes on Outer Ring Road', reportedAt: '3 hours ago', severity: 9 },
  { id: 6, type: 'pothole', latitude: 12.9550, longitude: 77.6350, status: 'in_progress', description: 'Pothole on Airport Road', reportedAt: '8 hours ago', severity: 7 },
  { id: 7, type: 'pothole', latitude: 12.9150, longitude: 77.6400, status: 'resolved', description: 'Pothole fixed on Bannerghatta Road', reportedAt: '2 days ago', severity: 6 },
  { id: 8, type: 'streetlight', latitude: 12.9716, longitude: 77.6412, status: 'critical', description: 'Broken streetlight on Indiranagar 100 Feet Road', reportedAt: '5 hours ago', severity: 8 },
  { id: 9, type: 'streetlight', latitude: 12.9400, longitude: 77.6150, status: 'in_progress', description: 'Streetlight flickering on BTM Layout Main Road', reportedAt: '6 hours ago', severity: 5 },
  { id: 10, type: 'streetlight', latitude: 12.9900, longitude: 77.5900, status: 'critical', description: 'Streetlight not working on Yelahanka Main Road', reportedAt: '4 hours ago', severity: 7 },
  { id: 11, type: 'streetlight', latitude: 12.9600, longitude: 77.6500, status: 'resolved', description: 'Streetlight replaced on Marathahalli Bridge', reportedAt: '5 days ago', severity: 5 },
  { id: 12, type: 'streetlight', latitude: 12.9450, longitude: 77.5750, status: 'critical', description: 'Dark zone on Mysore Road', reportedAt: '30 minutes ago', severity: 9 },
  { id: 13, type: 'police_booth', latitude: 12.9500, longitude: 77.6000, status: 'resolved', description: 'Police booth in HSR Layout Sector 1', reportedAt: '1 week ago', severity: 0 },
  { id: 14, type: 'police_booth', latitude: 12.9700, longitude: 77.6200, status: 'in_progress', description: 'Police booth under construction in Jayanagar 4th Block', reportedAt: '2 weeks ago', severity: 0 },
  { id: 15, type: 'police_booth', latitude: 12.9350, longitude: 77.6100, status: 'resolved', description: 'Police booth in Koramangala 5th Block', reportedAt: '3 days ago', severity: 0 },
  { id: 16, type: 'hospital', latitude: 12.9698, longitude: 77.5986, status: 'resolved', description: 'Manipal Hospital, HAL Airport Road', reportedAt: 'Permanent', severity: 0 },
  { id: 17, type: 'hospital', latitude: 12.9279, longitude: 77.6271, status: 'resolved', description: 'Apollo Hospital, Bannerghatta Road', reportedAt: 'Permanent', severity: 0 },
  { id: 18, type: 'hospital', latitude: 12.9716, longitude: 77.5946, status: 'resolved', description: 'St. Johns Medical College Hospital, MG Road', reportedAt: 'Permanent', severity: 0 },
  { id: 19, type: 'hospital', latitude: 12.9352, longitude: 77.6245, status: 'resolved', description: 'Fortis Hospital, Bannerghatta Road', reportedAt: 'Permanent', severity: 0 },
  { id: 20, type: 'hospital', latitude: 12.9550, longitude: 77.6350, status: 'resolved', description: 'Columbia Asia Hospital, Whitefield', reportedAt: 'Permanent', severity: 0 },
];

// GET /api/issues - Get all issues for citizen app
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, type, minSeverity } = req.query;

    let filteredIssues = [...mockIssues];

    // Filter by status
    if (status) {
      filteredIssues = filteredIssues.filter(issue => issue.status === status);
    }

    // Filter by type
    if (type) {
      filteredIssues = filteredIssues.filter(issue => issue.type === type);
    }

    // Filter by minimum severity
    if (minSeverity) {
      const minSev = parseInt(minSeverity as string);
      filteredIssues = filteredIssues.filter(issue => issue.severity >= minSev);
    }

    res.json({
      success: true,
      data: {
        issues: filteredIssues,
        total: filteredIssues.length,
        stats: {
          total: mockIssues.length,
          critical: mockIssues.filter(i => i.status === 'critical').length,
          inProgress: mockIssues.filter(i => i.status === 'in_progress').length,
          resolved: mockIssues.filter(i => i.status === 'resolved').length,
          potholes: mockIssues.filter(i => i.type === 'pothole').length,
          streetlights: mockIssues.filter(i => i.type === 'streetlight').length,
          policeBooths: mockIssues.filter(i => i.type === 'police_booth').length,
          hospitals: mockIssues.filter(i => i.type === 'hospital').length,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/issues/active - Get only active (non-resolved) issues
router.get('/active', async (req: Request, res: Response) => {
  try {
    const activeIssues = mockIssues.filter(issue => issue.status !== 'resolved');

    res.json({
      success: true,
      data: {
        issues: activeIssues,
        total: activeIssues.length
      }
    });
  } catch (error) {
    console.error('Error fetching active issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active issues',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/issues/critical - Get only critical issues
router.get('/critical', async (req: Request, res: Response) => {
  try {
    const criticalIssues = mockIssues.filter(issue => issue.status === 'critical');

    res.json({
      success: true,
      data: {
        issues: criticalIssues,
        total: criticalIssues.length
      }
    });
  } catch (error) {
    console.error('Error fetching critical issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch critical issues',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/issues/nearby - Get issues near a location
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const nearbyIssues = mockIssues.filter(issue => {
      const distance = calculateDistance(latitude, longitude, issue.latitude, issue.longitude);
      return distance <= radiusKm;
    });

    res.json({
      success: true,
      data: {
        issues: nearbyIssues,
        total: nearbyIssues.length,
        location: { latitude, longitude },
        radius: radiusKm
      }
    });
  } catch (error) {
    console.error('Error fetching nearby issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby issues',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
