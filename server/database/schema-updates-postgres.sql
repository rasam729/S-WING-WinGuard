-- WinGuard Database Schema Updates for PostgreSQL
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
  specialization JSONB,
  certifications JSONB,
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
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blacklisted')),
  blacklist_reason TEXT,
  last_project_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  milestones JSONB,
  quality_rating DECIMAL(3,2),
  timeliness_rating DECIMAL(3,2),
  communication_rating DECIMAL(3,2),
  overall_rating DECIMAL(3,2),
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES contractors(contractor_id) ON DELETE CASCADE
);

-- ============================================
-- 3. BUDGET ALLOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budget_allocations (
  allocation_id VARCHAR(50) PRIMARY KEY,
  fiscal_year VARCHAR(20) NOT NULL,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('central_govt', 'state_govt', 'municipal', 'private', 'donor')),
  source_name VARCHAR(200) NOT NULL,
  sanction_number VARCHAR(100),
  sanction_date DATE,
  amount DECIMAL(15,2) NOT NULL,
  purpose TEXT,
  conditions JSONB,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  breakdown JSONB,
  contractor_id VARCHAR(50),
  contractor_name VARCHAR(200),
  payments JSONB,
  approvals JSONB,
  invoices JSONB,
  receipts JSONB,
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
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('road', 'streetlight', 'drainage', 'bridge', 'signal')),
  asset_id VARCHAR(50) NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  address TEXT,
  ward VARCHAR(50),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  last_maintenance DATE,
  next_maintenance DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('preventive', 'corrective', 'predictive')),
  activities JSONB,
  estimated_duration INT,
  estimated_cost DECIMAL(10,2),
  assigned_to VARCHAR(50),
  assigned_team JSONB,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'overdue', 'cancelled')),
  notify_before INT DEFAULT 7,
  notifications_sent JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  materials_used JSONB,
  labor_hours INT,
  equipment_used JSONB,
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
  defects_found JSONB,
  before_photos JSONB,
  during_photos JSONB,
  after_photos JSONB,
  warranty_period INT,
  warranty_expiry_date DATE,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'under_warranty', 'warranty_expired', 'failed')),
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
  jurisdiction_type VARCHAR(20) NOT NULL CHECK (jurisdiction_type IN ('geographic', 'category', 'both')),
  wards JSONB,
  zones JSONB,
  categories JSONB,
  road_types JSONB,
  max_concurrent_issues INT DEFAULT 10,
  current_load INT DEFAULT 0,
  availability VARCHAR(20) DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'on_leave')),
  avg_resolution_time INT DEFAULT 0,
  resolution_rate DECIMAL(5,2) DEFAULT 0.00,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'escalated')),
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
ALTER TABLE reports ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS road_type VARCHAR(20) DEFAULT 'local' CHECK (road_type IN ('highway', 'arterial', 'collector', 'local'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ward VARCHAR(50);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS zone VARCHAR(50);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS alternate_contact VARCHAR(20);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS landmark VARCHAR(200);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS affected_area_size VARCHAR(20) CHECK (affected_area_size IN ('small', 'medium', 'large'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS traffic_impact VARCHAR(20) CHECK (traffic_impact IN ('none', 'low', 'medium', 'high'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS safety_risk INT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS weather_conditions VARCHAR(100);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS suggested_solution TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority_justification TEXT;

-- ============================================
-- 12. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);
CREATE INDEX IF NOT EXISTS idx_contractors_rating ON contractors(rating);
CREATE INDEX IF NOT EXISTS idx_budget_fiscal_year ON budget_allocations(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_date ON maintenance_schedules(next_maintenance);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_schedules(status);
CREATE INDEX IF NOT EXISTS idx_repair_asset ON repair_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_engineers_availability ON executive_engineers(availability);
CREATE INDEX IF NOT EXISTS idx_routing_priority ON routing_rules(priority);
CREATE INDEX IF NOT EXISTS idx_reports_country ON reports(country);
CREATE INDEX IF NOT EXISTS idx_reports_city ON reports(city);
CREATE INDEX IF NOT EXISTS idx_reports_ward ON reports(ward);
