import { create } from 'zustand';

export interface Issue {
  id: number;
  type: 'pothole' | 'streetlight' | 'police_booth' | 'hospital';
  latitude: number;
  longitude: number;
  status: 'critical' | 'in_progress' | 'resolved';
  description: string;
  reportedAt: string;
  severity: number;
}

interface IssuesStore {
  issues: Issue[];
  addIssue: (issue: Issue) => void;
  updateIssueStatus: (id: number, status: 'critical' | 'in_progress' | 'resolved') => void;
  getStats: () => {
    total: number;
    critical: number;
    inProgress: number;
    resolved: number;
    potholes: number;
    streetlights: number;
    policeBooths: number;
    hospitals: number;
  };
}

// Mock data with more issues including potholes
const initialIssues: Issue[] = [
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

export const useIssuesStore = create<IssuesStore>((set, get) => ({
  issues: initialIssues,
  
  addIssue: (issue) => set((state) => ({
    issues: [...state.issues, issue]
  })),
  
  updateIssueStatus: (id, status) => set((state) => ({
    issues: state.issues.map(issue =>
      issue.id === id ? { ...issue, status } : issue
    )
  })),
  
  getStats: () => {
    const issues = get().issues;
    return {
      total: issues.length,
      critical: issues.filter(i => i.status === 'critical').length,
      inProgress: issues.filter(i => i.status === 'in_progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      potholes: issues.filter(i => i.type === 'pothole').length,
      streetlights: issues.filter(i => i.type === 'streetlight').length,
      policeBooths: issues.filter(i => i.type === 'police_booth').length,
      hospitals: issues.filter(i => i.type === 'hospital').length,
    };
  },
}));
