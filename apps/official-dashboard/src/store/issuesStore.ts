import { create } from 'zustand';
import { GLOBAL_ISSUES } from '../data/globalData';

export interface Issue {
  id: string | number;
  type: 'pothole' | 'streetlight' | 'police_booth' | 'hospital' | 'camera' | 'road_crack' | 'drainage';
  latitude: number;
  longitude: number;
  status: 'critical' | 'in_progress' | 'resolved';
  description: string;
  reportedAt: string;
  severity: number;
  city?: string;
  country?: string;
  roadType?: string;
  estimatedCost?: number;
  currency?: string;
}

interface IssuesStore {
  issues: Issue[];
  addIssue: (issue: Issue) => void;
  updateIssueStatus: (id: string | number, status: 'critical' | 'in_progress' | 'resolved') => void;
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

// Seed initial issues from GLOBAL_ISSUES (globalized sample set)
const initialIssues: Issue[] = GLOBAL_ISSUES.slice(0, 14).map(g => ({
  id: g.id,
  type: g.type as Issue['type'],
  latitude: g.lat,
  longitude: g.lng,
  status: g.status,
  description: g.title + ' — ' + g.location,
  reportedAt: g.reportedAt,
  severity: g.severity,
  city: g.city,
  country: g.country,
  roadType: g.roadType,
  estimatedCost: g.estimatedCost,
  currency: g.currency
}));

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
