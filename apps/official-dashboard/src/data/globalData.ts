// ── Global Infrastructure Issues across world cities ──────────────────────────
export interface GlobalIssue {
  id: string;
  type: 'pothole' | 'streetlight' | 'police_booth' | 'camera' | 'road_crack' | 'drainage';
  title: string;
  location: string;
  city: string;
  country: string;
  continent: string;
  lat: number;
  lng: number;
  severity: number; // 1-10
  status: 'critical' | 'in_progress' | 'resolved';
  roadType: 'NH' | 'SH' | 'MDR' | 'Highway' | 'Motorway' | 'Arterial' | 'Local';
  lastRelayDate: string;
  contractorName: string;
  estimatedCost: number;
  currency: string;
  reportedAt: string;
}

export const GLOBAL_ISSUES: GlobalIssue[] = [
  // ── India ─────────────────────────────────────────────────────────────────
  { id: 'IN-001', type: 'pothole', title: 'Severe Pothole Cluster', location: 'Koramangala 5th Block', city: 'Bengaluru', country: 'India', continent: 'Asia', lat: 12.9352, lng: 77.6245, severity: 9, status: 'critical', roadType: 'SH', lastRelayDate: '2022-03-15', contractorName: 'L&T Construction', estimatedCost: 48000, currency: 'INR', reportedAt: '2025-12-10' },
  { id: 'IN-002', type: 'streetlight', title: 'Streetlight Out – 200m Stretch', location: 'Whitefield Main Rd', city: 'Bengaluru', country: 'India', continent: 'Asia', lat: 12.9698, lng: 77.7500, severity: 7, status: 'in_progress', roadType: 'NH', lastRelayDate: '2021-06-20', contractorName: 'BESCOM Infra Ltd', estimatedCost: 85000, currency: 'INR', reportedAt: '2026-01-15' },
  { id: 'IN-003', type: 'drainage', title: 'Clogged Drainage Flooding Road', location: 'HSR Layout Sector 4', city: 'Bengaluru', country: 'India', continent: 'Asia', lat: 12.9121, lng: 77.6446, severity: 8, status: 'in_progress', roadType: 'MDR', lastRelayDate: '2020-11-10', contractorName: 'BBMP Civil Works', estimatedCost: 145000, currency: 'INR', reportedAt: '2026-01-28' },
  { id: 'IN-004', type: 'police_booth', title: 'Police Booth Needed – High Crime Zone', location: 'Indiranagar 100ft Rd', city: 'Bengaluru', country: 'India', continent: 'Asia', lat: 12.9784, lng: 77.6408, severity: 8, status: 'critical', roadType: 'SH', lastRelayDate: '2023-01-05', contractorName: 'PWD Karnataka', estimatedCost: 320000, currency: 'INR', reportedAt: '2026-02-01' },
  { id: 'IN-005', type: 'road_crack', title: 'Road Surface Cracking', location: 'Jayanagar 4th Block', city: 'Bengaluru', country: 'India', continent: 'Asia', lat: 12.9252, lng: 77.5938, severity: 6, status: 'resolved', roadType: 'MDR', lastRelayDate: '2024-08-22', contractorName: 'Afcons Infrastructure', estimatedCost: 28000, currency: 'INR', reportedAt: '2025-11-20' },

  // ── USA ───────────────────────────────────────────────────────────────────
  { id: 'US-001', type: 'pothole', title: 'Highway Pothole – Accident Risk', location: 'I-95 North, Exit 42', city: 'New York', country: 'USA', continent: 'North America', lat: 40.7580, lng: -73.9855, severity: 9, status: 'critical', roadType: 'Highway', lastRelayDate: '2021-09-14', contractorName: 'Turner Construction', estimatedCost: 12000, currency: 'USD', reportedAt: '2026-01-05' },
  { id: 'US-002', type: 'streetlight', title: 'Dark Intersection – No Lighting', location: 'Sunset Blvd & Vine St', city: 'Los Angeles', country: 'USA', continent: 'North America', lat: 34.0983, lng: -118.3267, severity: 7, status: 'in_progress', roadType: 'Arterial', lastRelayDate: '2022-04-10', contractorName: 'LADWP Contractors', estimatedCost: 8500, currency: 'USD', reportedAt: '2026-02-12' },
  { id: 'US-003', type: 'drainage', title: 'Storm Drain Overflow', location: 'Michigan Ave, Chicago', city: 'Chicago', country: 'USA', continent: 'North America', lat: 41.8827, lng: -87.6233, severity: 8, status: 'critical', roadType: 'Arterial', lastRelayDate: '2020-07-15', contractorName: 'CDOT Engineering', estimatedCost: 45000, currency: 'USD', reportedAt: '2026-03-01' },

  // ── UK ────────────────────────────────────────────────────────────────────
  { id: 'UK-001', type: 'road_crack', title: 'Motorway Surface Degradation', location: 'M25 Junction 12', city: 'London', country: 'UK', continent: 'Europe', lat: 51.5074, lng: -0.3278, severity: 8, status: 'in_progress', roadType: 'Motorway', lastRelayDate: '2021-02-28', contractorName: 'Balfour Beatty', estimatedCost: 95000, currency: 'GBP', reportedAt: '2025-12-20' },
  { id: 'UK-002', type: 'pothole', title: 'Pothole Cluster – Bus Route', location: 'Oxford Street', city: 'London', country: 'UK', continent: 'Europe', lat: 51.5150, lng: -0.1415, severity: 7, status: 'resolved', roadType: 'Arterial', lastRelayDate: '2024-05-10', contractorName: 'Transport for London', estimatedCost: 18000, currency: 'GBP', reportedAt: '2025-11-05' },

  // ── Germany ───────────────────────────────────────────────────────────────
  { id: 'DE-001', type: 'camera', title: 'CCTV Coverage Gap – High Traffic', location: 'Autobahn A3 km 45', city: 'Frankfurt', country: 'Germany', continent: 'Europe', lat: 50.1109, lng: 8.6821, severity: 6, status: 'in_progress', roadType: 'Motorway', lastRelayDate: '2023-03-18', contractorName: 'Strabag SE', estimatedCost: 38000, currency: 'EUR', reportedAt: '2026-01-18' },
  { id: 'DE-002', type: 'streetlight', title: 'LED Upgrade Required', location: 'Unter den Linden', city: 'Berlin', country: 'Germany', continent: 'Europe', lat: 52.5200, lng: 13.4050, severity: 5, status: 'resolved', roadType: 'Arterial', lastRelayDate: '2024-09-01', contractorName: 'Berliner Stadtreinigung', estimatedCost: 22000, currency: 'EUR', reportedAt: '2025-10-10' },

  // ── Japan ─────────────────────────────────────────────────────────────────
  { id: 'JP-001', type: 'drainage', title: 'Typhoon Drainage Damage', location: 'Shinjuku Dori', city: 'Tokyo', country: 'Japan', continent: 'Asia', lat: 35.6895, lng: 139.6917, severity: 9, status: 'critical', roadType: 'Arterial', lastRelayDate: '2020-05-12', contractorName: 'Shimizu Corporation', estimatedCost: 8500000, currency: 'JPY', reportedAt: '2026-02-05' },
  { id: 'JP-002', type: 'police_booth', title: 'Koban Upgrade Required', location: 'Shibuya Crossing', city: 'Tokyo', country: 'Japan', continent: 'Asia', lat: 35.6590, lng: 139.7006, severity: 5, status: 'in_progress', roadType: 'Arterial', lastRelayDate: '2023-11-20', contractorName: 'Kajima Corporation', estimatedCost: 12000000, currency: 'JPY', reportedAt: '2026-01-22' },

  // ── Australia ─────────────────────────────────────────────────────────────
  { id: 'AU-001', type: 'pothole', title: 'Heat Damage – Road Cracking', location: 'Pacific Motorway', city: 'Sydney', country: 'Australia', continent: 'Oceania', lat: -33.8688, lng: 151.2093, severity: 7, status: 'in_progress', roadType: 'Motorway', lastRelayDate: '2022-08-15', contractorName: 'John Holland Group', estimatedCost: 28000, currency: 'AUD', reportedAt: '2026-01-10' },

  // ── Brazil ────────────────────────────────────────────────────────────────
  { id: 'BR-001', type: 'road_crack', title: 'Highway Erosion – Rainy Season', location: 'Rodovia Presidente Dutra', city: 'São Paulo', country: 'Brazil', continent: 'South America', lat: -23.5505, lng: -46.6333, severity: 9, status: 'critical', roadType: 'Highway', lastRelayDate: '2019-03-10', contractorName: 'OHL Brasil', estimatedCost: 185000, currency: 'BRL', reportedAt: '2026-02-20' },

  // ── UAE ───────────────────────────────────────────────────────────────────
  { id: 'AE-001', type: 'camera', title: 'Smart Surveillance Upgrade', location: 'Sheikh Zayed Road', city: 'Dubai', country: 'UAE', continent: 'Asia', lat: 25.2048, lng: 55.2708, severity: 5, status: 'resolved', roadType: 'Highway', lastRelayDate: '2024-01-15', contractorName: 'ALEC Engineering', estimatedCost: 95000, currency: 'AED', reportedAt: '2025-09-01' },

  // ── South Africa ──────────────────────────────────────────────────────────
  { id: 'ZA-001', type: 'streetlight', title: 'Load-shedding Streetlight Failures', location: 'N1 National Road', city: 'Johannesburg', country: 'South Africa', continent: 'Africa', lat: -26.2041, lng: 28.0473, severity: 8, status: 'critical', roadType: 'Highway', lastRelayDate: '2021-07-01', contractorName: 'Murray & Roberts', estimatedCost: 180000, currency: 'ZAR', reportedAt: '2026-03-02' },

  // ── Canada ────────────────────────────────────────────────────────────────
  { id: 'CA-001', type: 'pothole', title: 'Winter Freeze-Thaw Damage', location: 'Trans-Canada Hwy 1', city: 'Toronto', country: 'Canada', continent: 'North America', lat: 43.6532, lng: -79.3832, severity: 8, status: 'in_progress', roadType: 'Highway', lastRelayDate: '2021-11-30', contractorName: 'PCL Construction', estimatedCost: 32000, currency: 'CAD', reportedAt: '2026-01-25' },

  // ── Singapore ─────────────────────────────────────────────────────────────
  { id: 'SG-001', type: 'drainage', title: 'Flash Flood Risk – Low Lying Area', location: 'Orchard Road', city: 'Singapore', country: 'Singapore', continent: 'Asia', lat: 1.3521, lng: 103.8198, severity: 7, status: 'resolved', roadType: 'Arterial', lastRelayDate: '2024-04-10', contractorName: 'Surbana Jurong', estimatedCost: 95000, currency: 'SGD', reportedAt: '2025-12-05' },
];

// ── Currencies ────────────────────────────────────────────────────────────────
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rateToUSD: number; // rate: 1 USD = X units
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',  name: 'US Dollar',         flag: '🇺🇸', rateToUSD: 1 },
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee',      flag: '🇮🇳', rateToUSD: 83.5 },
  { code: 'GBP', symbol: '£',  name: 'British Pound',     flag: '🇬🇧', rateToUSD: 0.79 },
  { code: 'EUR', symbol: '€',  name: 'Euro',              flag: '🇪🇺', rateToUSD: 0.92 },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',      flag: '🇯🇵', rateToUSD: 157.4 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rateToUSD: 1.53 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real',    flag: '🇧🇷', rateToUSD: 4.97 },
  { code: 'AED', symbol: 'د.إ',name: 'UAE Dirham',        flag: '🇦🇪', rateToUSD: 3.67 },
  { code: 'ZAR', symbol: 'R',  name: 'South African Rand',flag: '🇿🇦', rateToUSD: 18.65 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',   flag: '🇨🇦', rateToUSD: 1.36 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar',  flag: '🇸🇬', rateToUSD: 1.35 },
  { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan',      flag: '🇨🇳', rateToUSD: 7.24 },
];

// Convert amount from one currency to another
export function convertCurrency(amount: number, fromCode: string, toCode: string): number {
  const from = CURRENCIES.find(c => c.code === fromCode);
  const to   = CURRENCIES.find(c => c.code === toCode);
  if (!from || !to) return amount;
  const inUSD = amount / from.rateToUSD;
  return inUSD * to.rateToUSD;
}

export function formatCurrency(amount: number, code: string): string {
  const cur = CURRENCIES.find(c => c.code === code);
  if (!cur) return `${amount.toLocaleString()}`;
  return `${cur.symbol}${Math.round(amount).toLocaleString()}`;
}

// ── Global Engineers / Authorities ───────────────────────────────────────────
export interface Authority {
  id: string;
  name: string;
  designation: string;
  department: string;
  country: string;
  city: string;
  phone: string;
  email: string;
  whatsapp?: string;
  categories: string[];
  avgResponseHours: number;
  rating: number;
}

export const AUTHORITIES: Authority[] = [
  { id: 'E-IN-01', name: 'Rajesh Kumar',   designation: 'Executive Engineer', department: 'BBMP Roads',     country: 'India',       city: 'Bengaluru',   phone: '+91-80-22221111', email: 'rajesh.kumar@bbmp.gov.in',       whatsapp: '+919876543210', categories: ['pothole','road_crack','drainage'], avgResponseHours: 24, rating: 4.2 },
  { id: 'E-IN-02', name: 'Priya Nair',     designation: 'Dy. Commissioner',   department: 'BESCOM',         country: 'India',       city: 'Bengaluru',   phone: '+91-80-22222222', email: 'priya.nair@bescom.org',           whatsapp: '+919876543211', categories: ['streetlight'],                     avgResponseHours: 12, rating: 4.5 },
  { id: 'E-IN-03', name: 'S. Venkatesh',   designation: 'DCP Traffic',        department: 'Bengaluru Police',country: 'India',      city: 'Bengaluru',   phone: '+91-80-22943222', email: 'dcp.traffic@ksp.gov.in',          whatsapp: '+919876543212', categories: ['police_booth','camera'],           avgResponseHours: 6,  rating: 4.7 },
  { id: 'E-US-01', name: 'John Mitchell',  designation: 'District Engineer',  department: 'NYC DOT',        country: 'USA',         city: 'New York',    phone: '+1-212-639-9675',  email: 'john.mitchell@dot.nyc.gov',       categories: ['pothole','road_crack'],            avgResponseHours: 48, rating: 3.9 },
  { id: 'E-US-02', name: 'Sarah Johnson',  designation: 'Traffic Engineer',   department: 'LADOT',          country: 'USA',         city: 'Los Angeles', phone: '+1-213-972-8470',  email: 'sjohnson@ladot.lacity.org',       categories: ['streetlight','camera'],            avgResponseHours: 36, rating: 4.1 },
  { id: 'E-UK-01', name: 'James Wilson',   designation: 'Highway Engineer',   department: 'Highways England',country: 'UK',         city: 'London',      phone: '+44-300-123-5000', email: 'james.wilson@highways.gov.uk',    categories: ['pothole','road_crack','drainage'], avgResponseHours: 48, rating: 4.3 },
  { id: 'E-DE-01', name: 'Hans Müller',    designation: 'Straßenbauamt',      department: 'Bundesfernstraßen',country: 'Germany',   city: 'Frankfurt',   phone: '+49-69-1234567',   email: 'h.mueller@strabag.de',            categories: ['camera','streetlight'],            avgResponseHours: 72, rating: 4.0 },
  { id: 'E-JP-01', name: 'Hiroshi Tanaka', designation: 'Road Administrator', department: 'MLIT Japan',    country: 'Japan',       city: 'Tokyo',       phone: '+81-3-5253-8111',  email: 'h.tanaka@mlit.go.jp',             categories: ['drainage','pothole'],              avgResponseHours: 24, rating: 4.6 },
  { id: 'E-AU-01', name: 'Liam O\'Brien',  designation: 'Roads Engineer',     department: 'Transport NSW', country: 'Australia',   city: 'Sydney',      phone: '+61-2-8396-1000',  email: 'liam.obrien@transport.nsw.gov.au',categories: ['pothole','road_crack'],            avgResponseHours: 48, rating: 4.2 },
  { id: 'E-SG-01', name: 'Wei Liang',      designation: 'Senior Engineer',    department: 'LTA Singapore', country: 'Singapore',   city: 'Singapore',   phone: '+65-1800-225-5582', email: 'wei.liang@lta.gov.sg',            categories: ['drainage','streetlight'],          avgResponseHours: 18, rating: 4.8 },
];

export function getAuthoritiesForIssue(category: string, _city: string, country: string): Authority[] {
  const matchCountry = AUTHORITIES.filter(a =>
    a.country === country && a.categories.some(c => c === category || category.toLowerCase().includes(c))
  );
  if (matchCountry.length > 0) return matchCountry;
  // fallback: any matching category
  return AUTHORITIES.filter(a =>
    a.categories.some(c => c === category || category.toLowerCase().includes(c))
  ).slice(0, 2);
}

// ── Road metadata by country standards ───────────────────────────────────────
export const ROAD_TYPES: Record<string, string[]> = {
  'India':       ['NH', 'SH', 'MDR', 'ODR', 'Village Road'],
  'USA':         ['Interstate', 'US Highway', 'State Route', 'County Road', 'Local'],
  'UK':          ['Motorway', 'A Road', 'B Road', 'Local'],
  'Germany':     ['Autobahn', 'Bundesstraße', 'Landesstraße', 'Kreisstraße'],
  'Japan':       ['National Route', 'Prefectural Road', 'Municipal Road'],
  'Australia':   ['Motorway', 'State Highway', 'National Highway', 'Local Road'],
  'Brazil':      ['Federal Highway', 'State Highway', 'Municipal Road'],
  'UAE':         ['Sheikh Zayed Road', 'Emirates Road', 'Al Khail Road', 'Local'],
  'South Africa':['National Road', 'Provincial Road', 'Metropolitan Road'],
  'Canada':      ['Trans-Canada', 'Provincial Highway', 'County Road'],
  'Singapore':   ['Expressway', 'Major Arterial', 'Minor Arterial', 'Local Access'],
};
