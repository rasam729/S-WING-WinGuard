-- WinGuard Database Schema Updates
-- Complete schema for all new features

-- ============================================
-- 1. CONTRACTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contractors (
  contractor_id VARCHAR(50) PRIMARY KEY,
  company_name VARCHAR(200) NOT NULL,
  registration_number VARCHAR(100) UNIQUE,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  alternate_phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  pincode VARCHAR(20),
  specialization JSON,
  certifications JSON,
  experience INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  completed_projects INT DEFAULT 0,
  ongoing_projects INT DEFAULT 0,
  avg_completion_time INT DEFAULT 0,
  quality_score INT DEFAULT 0,
  registered_capital DECIMAL(15,2),
  annual_turnover DECIMAL(15,2),
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  status ENUM('active', 'suspended', 'blacklisted') DEFAULT 'active',
  blacklist_reason TEXT,
  last_project_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 2. CONTRACTOR ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contractor_assignments (
  assignment_id VARCHAR(50) PRIMARY KEY,
  issue_id INT,
  contractor_id VARCHAR(50),
  assigned_by INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_completion_date DATE,
  actual_completion_date DATE,
  contract_value DECIMAL(15,2),
  advance_payment DECIMAL(15,2),
  milestones JSON,
  quality_rating DECIMAL(3,2),
  timeliness_rating DECIMAL(3,2),
  communication_rating DECIMAL(3,2),
  overall_rating DECIMAL(3,2),
  status ENUM('assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'assigned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES contractors(contractor_id) ON DELETE CASCADE
);

-- ============================================
-- 3. BUDGET ALLOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budget_allocations (
  allocation_id VARCHAR(50) PRIMARY KEY,
  fiscal_year VARCHAR(20) NOT NULL,
  source_type ENUM('central_govt', 'state_govt', 'municipal', 'private', 'donor') NOT NULL,
  source_name VARCHAR(200) NOT NULL,
  sanction_number VARCHAR(100),
  sanction_date DATE,
  amount DECIMAL(15,2) NOT NULL,
  purpose TEXT,
  conditions JSON,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 4. BUDGET CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budget_categories (
  category_id VARCHAR(50) PRIMARY KEY,
  allocation_id VARCHAR(50),
  category VARCHAR(100) NOT NULL,
  allocated DECIMAL(15,2) NOT NULL,
  spent DECIMAL(15,2) DEFAULT 0,
  committed DECIMAL(15,2) DEFAULT 0,
  available DECIMAL(15,2) NOT NULL,
  percentage DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (allocation_id) REFERENCES budget_allocations(allocation_id) ON DELETE CASCADE
);

-- ============================================
-- 5. EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  expense_id VARCHAR(50) PRIMARY KEY,
  issue_id INT,
  category VARCHAR(100),
  estimated_cost DECIMAL(15,2),
  sanctioned_amount DECIMAL(15,2),
  actual_cost DECIMAL(15,2),
  variance DECIMAL(15,2),
  variance_percentage DECIMAL(5,2),
  breakdown JSON,
  contractor_id VARCHAR(50),
  contractor_name VARCHAR(200),
  payments JSON,
  approvals JSON,
  invoices JSON,
  receipts JSON,
  work_completion_certificate VARCHAR(255),
  publicly_visible BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES contractors(contractor_id) ON DELETE SET NULL
);

-- ============================================
-- 6. MAINTENANCE SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  schedule_id VARCHAR(50) PRIMARY KEY,
  asset_type ENUM('road', 'streetlight', 'drainage', 'bridge', 'signal') NOT NULL,
  asset_id VARCHAR(50) NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  address TEXT,
  ward VARCHAR(50),
  frequency ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annual') NOT NULL,
  last_maintenance DATE,
  next_maintenance DATE NOT NULL,
  type ENUM('preventive', 'corrective', 'predictive') NOT NULL,
  activities JSON,
  estimated_duration INT,
  estimated_cost DECIMAL(10,2),
  assigned_to VARCHAR(50),
  assigned_team JSON,
  status ENUM('scheduled', 'in_progress', 'completed', 'overdue', 'cancelled') DEFAULT 'scheduled',
  notify_before INT DEFAULT 7,
  notifications_sent JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES contractors(contractor_id) ON DELETE SET NULL
);

-- ============================================
-- 7. REPAIR HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS repair_history (
  repair_id VARCHAR(50) PRIMARY KEY,
  issue_id INT,
  asset_id VARCHAR(50),
  reported_date DATE NOT NULL,
  reported_by INT,
  issue_type VARCHAR(100),
  severity INT,
  description TEXT,
  repair_start_date DATE,
  repair_end_date DATE,
  duration INT,
  work_description TEXT,
  materials_used JSON,
  labor_hours INT,
  equipment_used JSON,
  contractor_id VARCHAR(50),
  contractor_name VARCHAR(200),
  supervisor_name VARCHAR(100),
  workers_count INT,
  estimated_cost DECIMAL(15,2),
  actual_cost DECIMAL(15,2),
  variance DECIMAL(15,2),
  quality_check_date DATE,
  quality_check_by VARCHAR(100),
  quality_rating DECIMAL(3,2),
  defects_found JSON,
  before_photos JSON,
  during_photos JSON,
  after_photos JSON,
  warranty_period INT,
  warranty_expiry_date DATE,
  status ENUM('completed', 'under_warranty', 'warranty_expired', 'failed') DEFAULT 'completed',
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES contractors(contractor_id) ON DELETE SET NULL
);

-- ============================================
-- 8. EXECUTIVE ENGINEERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS executive_engineers (
  engineer_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  designation VARCHAR(100),
  department VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  jurisdiction_type ENUM('geographic', 'category', 'both') NOT NULL,
  wards JSON,
  zones JSON,
  categories JSON,
  road_types JSON,
  max_concurrent_issues INT DEFAULT 10,
  current_load INT DEFAULT 0,
  availability ENUM('available', 'busy', 'on_leave') DEFAULT 'available',
  avg_resolution_time INT DEFAULT 0,
  resolution_rate DECIMAL(5,2) DEFAULT 0.00,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 9. ROUTING RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS routing_rules (
  rule_id VARCHAR(50) PRIMARY KEY,
  priority INT NOT NULL,
  category VARCHAR(50),
  severity_min INT,
  severity_max INT,
  ward VARCHAR(50),
  road_type VARCHAR(50),
  assign_to VARCHAR(50),
  escalate_after INT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assign_to) REFERENCES executive_engineers(engineer_id) ON DELETE SET NULL
);

-- ============================================
-- 10. ISSUE ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS issue_assignments (
  assignment_id VARCHAR(50) PRIMARY KEY,
  issue_id INT NOT NULL,
  engineer_id VARCHAR(50),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT,
  status ENUM('assigned', 'accepted', 'in_progress', 'completed', 'escalated') DEFAULT 'assigned',
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  escalated_at TIMESTAMP,
  escalation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (engineer_id) REFERENCES executive_engineers(engineer_id) ON DELETE SET NULL
);

-- ============================================
-- 11. UPDATE REPORTS TABLE FOR GLOBAL SUPPORT
-- ============================================
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS road_type ENUM('highway', 'arterial', 'collector', 'local') DEFAULT 'local',
ADD COLUMN IF NOT EXISTS ward VARCHAR(50),
ADD COLUMN IF NOT EXISTS zone VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100),
ADD COLUMN IF NOT EXISTS alternate_contact VARCHAR(20),
ADD COLUMN IF NOT EXISTS landmark VARCHAR(200),
ADD COLUMN IF NOT EXISTS affected_area_size ENUM('small', 'medium', 'large'),
ADD COLUMN IF NOT EXISTS traffic_impact ENUM('none', 'low', 'medium', 'high'),
ADD COLUMN IF NOT EXISTS safety_risk INT,
ADD COLUMN IF NOT EXISTS weather_conditions VARCHAR(100),
ADD COLUMN IF NOT EXISTS suggested_solution TEXT,
ADD COLUMN IF NOT EXISTS priority_justification TEXT;

-- ============================================
-- 12. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_contractors_status ON contractors(status);
CREATE INDEX idx_contractors_rating ON contractors(rating);
CREATE INDEX idx_budget_fiscal_year ON budget_allocations(fiscal_year);
CREATE INDEX idx_maintenance_next_date ON maintenance_schedules(next_maintenance);
CREATE INDEX idx_maintenance_status ON maintenance_schedules(status);
CREATE INDEX idx_repair_asset ON repair_history(asset_id);
CREATE INDEX idx_engineers_availability ON executive_engineers(availability);
CREATE INDEX idx_routing_priority ON routing_rules(priority);
CREATE INDEX idx_reports_country ON reports(country);
CREATE INDEX idx_reports_city ON reports(city);
CREATE INDEX idx_reports_ward ON reports(ward);

-- ============================================
-- 13. SAMPLE DATA - CONTRACTORS
-- ============================================
INSERT INTO contractors (contractor_id, company_name, registration_number, contact_person, email, phone, address, city, state, country, specialization, experience, rating, completed_projects, quality_score, status) VALUES
('CONT001', 'ABC Road Constructions Pvt Ltd', 'REG2023001', 'Rajesh Kumar', 'rajesh@abcroad.com', '9876543210', '123 MG Road', 'Bengaluru', 'Karnataka', 'India', '["road_repair", "pothole_filling"]', 15, 4.5, 150, 85, 'active'),
('CONT002', 'XYZ Infrastructure Solutions', 'REG2023002', 'Priya Sharma', 'priya@xyzinfra.com', '9876543211', '456 Brigade Road', 'Bengaluru', 'Karnataka', 'India', '["streetlight", "electrical"]', 10, 4.2, 100, 80, 'active'),
('CONT003', 'PQR Drainage Experts', 'REG2023003', 'Amit Patel', 'amit@pqrdrainage.com', '9876543212', '789 Residency Road', 'Bengaluru', 'Karnataka', 'India', '["drainage", "sewage"]', 12, 4.7, 120, 90, 'active'),
('CONT004', 'LMN Civil Works', 'REG2023004', 'Sunita Reddy', 'sunita@lmncivil.com', '9876543213', '321 Whitefield', 'Bengaluru', 'Karnataka', 'India', '["road_repair", "bridge_construction"]', 20, 4.8, 200, 92, 'active'),
('CONT005', 'DEF Maintenance Services', 'REG2023005', 'Vikram Singh', 'vikram@defmaint.com', '9876543214', '654 Koramangala', 'Bengaluru', 'Karnataka', 'India', '["preventive_maintenance", "road_repair"]', 8, 4.0, 80, 75, 'active');

-- ============================================
-- 14. SAMPLE DATA - EXECUTIVE ENGINEERS
-- ============================================
INSERT INTO executive_engineers (engineer_id, name, designation, department, email, phone, jurisdiction_type, wards, categories, max_concurrent_issues, availability, rating) VALUES
('ENG001', 'Dr. Ramesh Kumar', 'Executive Engineer', 'Roads & Infrastructure', 'ramesh.kumar@gov.in', '9876501234', 'both', '["Ward 1", "Ward 2", "Ward 3"]', '["pothole", "road_damage"]', 15, 'available', 4.5),
('ENG002', 'Mrs. Lakshmi Iyer', 'Executive Engineer', 'Electrical Department', 'lakshmi.iyer@gov.in', '9876501235', 'category', '[]', '["streetlight", "traffic_signal"]', 12, 'available', 4.3),
('ENG003', 'Mr. Suresh Reddy', 'Executive Engineer', 'Drainage & Sewage', 'suresh.reddy@gov.in', '9876501236', 'both', '["Ward 4", "Ward 5"]', '["drainage", "sewage"]', 10, 'available', 4.6),
('ENG004', 'Dr. Anjali Mehta', 'Executive Engineer', 'Public Works', 'anjali.mehta@gov.in', '9876501237', 'geographic', '["Ward 6", "Ward 7", "Ward 8"]', '[]', 20, 'available', 4.7),
('ENG005', 'Mr. Karthik Nair', 'Executive Engineer', 'Urban Development', 'karthik.nair@gov.in', '9876501238', 'both', '["Ward 9", "Ward 10"]', '["pothole", "streetlight", "drainage"]', 15, 'available', 4.4);

-- ============================================
-- 15. SAMPLE DATA - ROUTING RULES
-- ============================================
INSERT INTO routing_rules (rule_id, priority, category, severity_min, severity_max, assign_to, escalate_after, active) VALUES
('RULE001', 1, 'pothole', 8, 10, 'ENG001', 24, TRUE),
('RULE002', 2, 'pothole', 5, 7, 'ENG001', 48, TRUE),
('RULE003', 1, 'streetlight', 7, 10, 'ENG002', 24, TRUE),
('RULE004', 2, 'streetlight', 4, 6, 'ENG002', 72, TRUE),
('RULE005', 1, 'drainage', 8, 10, 'ENG003', 12, TRUE),
('RULE006', 2, 'drainage', 5, 7, 'ENG003', 48, TRUE);

-- ============================================
-- 16. SAMPLE DATA - BUDGET ALLOCATIONS
-- ============================================
INSERT INTO budget_allocations (allocation_id, fiscal_year, source_type, source_name, sanction_number, sanction_date, amount, purpose, start_date, end_date) VALUES
('BUDGET2024001', '2024-25', 'central_govt', 'Ministry of Road Transport and Highways', 'SANC/2024/001', '2024-04-01', 50000000, 'Road Infrastructure Development', '2024-04-01', '2025-03-31'),
('BUDGET2024002', '2024-25', 'state_govt', 'Karnataka State Government', 'SANC/2024/002', '2024-04-01', 30000000, 'Urban Infrastructure Maintenance', '2024-04-01', '2025-03-31'),
('BUDGET2024003', '2024-25', 'municipal', 'Bengaluru Municipal Corporation', 'SANC/2024/003', '2024-04-01', 20000000, 'Street Lighting and Drainage', '2024-04-01', '2025-03-31');

-- ============================================
-- 17. SAMPLE DATA - BUDGET CATEGORIES
-- ============================================
INSERT INTO budget_categories (category_id, allocation_id, category, allocated, spent, committed, available, percentage) VALUES
('CAT001', 'BUDGET2024001', 'Pothole Repairs', 15000000, 5000000, 3000000, 7000000, 30.00),
('CAT002', 'BUDGET2024001', 'Road Resurfacing', 20000000, 8000000, 5000000, 7000000, 40.00),
('CAT003', 'BUDGET2024001', 'Bridge Maintenance', 15000000, 4000000, 2000000, 9000000, 30.00),
('CAT004', 'BUDGET2024002', 'Streetlight Installation', 12000000, 4000000, 2000000, 6000000, 40.00),
('CAT005', 'BUDGET2024002', 'Drainage System', 10000000, 3000000, 2000000, 5000000, 33.33),
('CAT006', 'BUDGET2024002', 'Traffic Signals', 8000000, 2000000, 1000000, 5000000, 26.67),
('CAT007', 'BUDGET2024003', 'Street Lighting', 12000000, 3000000, 2000000, 7000000, 60.00),
('CAT008', 'BUDGET2024003', 'Drainage Cleaning', 8000000, 2000000, 1000000, 5000000, 40.00);

-- ============================================
-- 18. SAMPLE GLOBAL ISSUES
-- ============================================
INSERT INTO reports (category, severity, description, latitude, longitude, status, country, city, road_type, created_at) VALUES
-- India
('Pothole', 8, 'Large pothole on main road causing traffic issues', 19.0760, 72.8777, 'Report Received', 'India', 'Mumbai', 'arterial', NOW()),
('Streetlight', 6, 'Non-functional streetlight in residential area', 28.6139, 77.2090, 'Report Received', 'India', 'Delhi', 'local', NOW()),
('Drainage', 7, 'Blocked drainage system causing waterlogging', 12.9716, 77.5946, 'Report Received', 'India', 'Bengaluru', 'collector', NOW()),
('Pothole', 9, 'Critical pothole on highway', 13.0827, 80.2707, 'Report Received', 'India', 'Chennai', 'highway', NOW()),
('Road Damage', 7, 'Damaged road surface', 18.5204, 73.8567, 'Report Received', 'India', 'Pune', 'arterial', NOW()),

-- USA
('Pothole', 7, 'Road damage after winter', 40.7128, -74.0060, 'Report Received', 'USA', 'New York', 'arterial', NOW()),
('Road Damage', 6, 'Cracked pavement on main street', 34.0522, -118.2437, 'Report Received', 'USA', 'Los Angeles', 'collector', NOW()),
('Streetlight', 5, 'Streetlight not working', 41.8781, -87.6298, 'Report Received', 'USA', 'Chicago', 'local', NOW()),

-- UK
('Streetlight', 5, 'Dim streetlight needs replacement', 51.5074, -0.1278, 'Report Received', 'UK', 'London', 'local', NOW()),
('Pothole', 6, 'Small pothole on residential road', 53.4808, -2.2426, 'Report Received', 'UK', 'Manchester', 'local', NOW()),

-- Australia
('Road Damage', 7, 'Damaged road surface affecting traffic', -33.8688, 151.2093, 'Report Received', 'Australia', 'Sydney', 'arterial', NOW()),
('Drainage', 6, 'Poor drainage causing flooding', -37.8136, 144.9631, 'Report Received', 'Australia', 'Melbourne', 'collector', NOW()),

-- Japan
('Pothole', 5, 'Minor road issue needs attention', 35.6762, 139.6503, 'Report Received', 'Japan', 'Tokyo', 'local', NOW()),
('Streetlight', 4, 'Streetlight maintenance required', 34.6937, 135.5023, 'Report Received', 'Japan', 'Osaka', 'local', NOW()),

-- Germany
('Road Damage', 6, 'Road surface deterioration', 52.5200, 13.4050, 'Report Received', 'Germany', 'Berlin', 'arterial', NOW()),
('Pothole', 5, 'Small pothole on city road', 48.1351, 11.5820, 'Report Received', 'Germany', 'Munich', 'collector', NOW()),

-- Brazil
('Pothole', 8, 'Large pothole affecting traffic flow', -23.5505, -46.6333, 'Report Received', 'Brazil', 'São Paulo', 'arterial', NOW()),
('Drainage', 7, 'Flooding issue during rain', -22.9068, -43.1729, 'Report Received', 'Brazil', 'Rio de Janeiro', 'collector', NOW()),

-- South Africa
('Road Damage', 7, 'Damaged road needs repair', -26.2041, 28.0473, 'Report Received', 'South Africa', 'Johannesburg', 'arterial', NOW()),
('Pothole', 6, 'Pothole on highway', -33.9249, 18.4241, 'Report Received', 'South Africa', 'Cape Town', 'highway', NOW()),

-- China
('Streetlight', 5, 'Streetlight issue in commercial area', 39.9042, 116.4074, 'Report Received', 'China', 'Beijing', 'arterial', NOW()),
('Drainage', 6, 'Drainage problem needs attention', 31.2304, 121.4737, 'Report Received', 'China', 'Shanghai', 'collector', NOW()),

-- UAE
('Road Damage', 4, 'Minor road issue', 25.2048, 55.2708, 'Report Received', 'UAE', 'Dubai', 'arterial', NOW()),
('Streetlight', 3, 'Streetlight maintenance needed', 24.4539, 54.3773, 'Report Received', 'UAE', 'Abu Dhabi', 'local', NOW());

-- ============================================
-- SCHEMA UPDATE COMPLETE
-- ============================================
