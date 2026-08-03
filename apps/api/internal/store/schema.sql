PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS colleges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL DEFAULT '',
  institution_type TEXT NOT NULL CHECK (institution_type IN ('college', 'university')),
  ownership TEXT NOT NULL CHECK (ownership IN ('government', 'private', 'deemed')),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  website TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);
CREATE INDEX IF NOT EXISTS idx_colleges_state ON colleges(state);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  venue TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  registration_deadline TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  banner_url TEXT NOT NULL DEFAULT '',
  organizer_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_college ON events(college_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  college_name TEXT NOT NULL,
  course TEXT NOT NULL,
  year_of_study TEXT NOT NULL,
  pass_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'checked_in')),
  checked_in_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_token ON registrations(pass_token);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_hash ON sessions(token_hash);

-- ERP tenancy and commercial operations
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  legal_name TEXT NOT NULL DEFAULT '',
  gstin TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','event_manager','ticketing_manager','sponsorship_manager','finance_manager','checkin_operator','viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','disabled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, admin_id)
);

CREATE TABLE IF NOT EXISTS organization_events (
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY (organization_id, event_id)
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_paise INTEGER NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  sold_quantity INTEGER NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
  min_per_order INTEGER NOT NULL DEFAULT 1 CHECK (min_per_order > 0),
  max_per_order INTEGER NOT NULL DEFAULT 1 CHECK (max_per_order > 0),
  sales_start TEXT NOT NULL,
  sales_end TEXT NOT NULL,
  benefits TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','paused','sold_out','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, name)
);

CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id);

CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  max_discount_paise INTEGER,
  minimum_order_paise INTEGER NOT NULL DEFAULT 0,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','expired')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  subtotal_paise INTEGER NOT NULL CHECK (subtotal_paise >= 0),
  discount_paise INTEGER NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  total_paise INTEGER NOT NULL CHECK (total_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  coupon_id INTEGER REFERENCES coupons(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','refunded','partially_refunded')),
  payment_status TEXT NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('not_required','pending','paid','failed','refunded','partially_refunded')),
  payment_provider TEXT NOT NULL DEFAULT '',
  provider_order_id TEXT NOT NULL DEFAULT '',
  provider_payment_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(buyer_email);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise >= 0),
  line_total_paise INTEGER NOT NULL CHECK (line_total_paise >= 0)
);

CREATE TABLE IF NOT EXISTS sponsors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect','active','inactive')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS sponsorship_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
  description TEXT NOT NULL DEFAULT '',
  inventory INTEGER NOT NULL DEFAULT 1 CHECK (inventory > 0),
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','sold_out','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, name)
);

CREATE TABLE IF NOT EXISTS sponsorship_deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sponsor_id INTEGER NOT NULL REFERENCES sponsors(id) ON DELETE RESTRICT,
  package_id INTEGER REFERENCES sponsorship_packages(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'prospect' CHECK (stage IN ('prospect','contacted','meeting','proposal','negotiation','verbal_confirmation','contract_signed','payment_pending','active','completed','lost')),
  contracted_value_paise INTEGER NOT NULL DEFAULT 0,
  cash_value_paise INTEGER NOT NULL DEFAULT 0,
  in_kind_value_paise INTEGER NOT NULL DEFAULT 0,
  received_paise INTEGER NOT NULL DEFAULT 0,
  owner_name TEXT NOT NULL DEFAULT '',
  next_action TEXT NOT NULL DEFAULT '',
  next_action_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sponsorship_deals_event ON sponsorship_deals(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_deals_stage ON sponsorship_deals(stage);

CREATE TABLE IF NOT EXISTS sponsorship_deliverables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES sponsorship_deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  owner_name TEXT NOT NULL DEFAULT '',
  due_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','awaiting_approval','completed','waived')),
  evidence_url TEXT NOT NULL DEFAULT '',
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  tax_paise INTEGER NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','approved','paid','void')),
  incurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id, created_at);

-- Launch Bharat is EventWallah's flagship national programme. These records
-- intentionally live beside regular events: the programme may use an event for
-- its on-ground flagship, but it also has a longer college/startup lifecycle.
CREATE TABLE IF NOT EXISTS launch_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  edition TEXT NOT NULL,
  tagline TEXT NOT NULL,
  summary TEXT NOT NULL,
  vision TEXT NOT NULL,
  applications_open_at TEXT NOT NULL,
  applications_close_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','paused','completed','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS launch_college_partnerships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  program_id INTEGER NOT NULL REFERENCES launch_programs(id) ON DELETE CASCADE,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect','onboarding','active','completed','declined')),
  phase TEXT NOT NULL DEFAULT 'college_onboarding' CHECK (phase IN ('college_onboarding','campus_activation','flagship','incubation','alumni')),
  lead_name TEXT NOT NULL,
  lead_email TEXT NOT NULL,
  mou_signed_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(program_id, college_id)
);

CREATE INDEX IF NOT EXISTS idx_launch_partnerships_program ON launch_college_partnerships(program_id, status);

CREATE TABLE IF NOT EXISTS launch_problem_statements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL REFERENCES launch_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  category TEXT NOT NULL,
  sponsor_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(program_id, title)
);

CREATE TABLE IF NOT EXISTS launch_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  program_id INTEGER NOT NULL REFERENCES launch_programs(id) ON DELETE CASCADE,
  partnership_id INTEGER REFERENCES launch_college_partnerships(id) ON DELETE SET NULL,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  problem_statement_id INTEGER REFERENCES launch_problem_statements(id) ON DELETE SET NULL,
  team_name TEXT NOT NULL,
  venture_name TEXT NOT NULL,
  summary TEXT NOT NULL,
  pitch_deck_url TEXT NOT NULL DEFAULT '',
  prototype_url TEXT NOT NULL DEFAULT '',
  lead_email TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'applied' CHECK (stage IN ('applied','eligible','shortlisted','finalist','incubating','launched','rejected','withdrawn')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(program_id, lead_email)
);

CREATE INDEX IF NOT EXISTS idx_launch_teams_program_stage ON launch_teams(program_id, stage);
CREATE INDEX IF NOT EXISTS idx_launch_teams_college ON launch_teams(college_id);

CREATE TABLE IF NOT EXISTS launch_team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL REFERENCES launch_teams(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  course TEXT NOT NULL,
  year_of_study TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('founder','cofounder','member')),
  is_lead INTEGER NOT NULL DEFAULT 0 CHECK (is_lead IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, email)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_launch_team_single_lead ON launch_team_members(team_id) WHERE is_lead = 1;

CREATE TABLE IF NOT EXISTS launch_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL REFERENCES launch_teams(id) ON DELETE CASCADE,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  round TEXT NOT NULL CHECK (round IN ('screening','campus_pitch','grand_pitch')),
  innovation_score INTEGER NOT NULL CHECK (innovation_score BETWEEN 1 AND 10),
  feasibility_score INTEGER NOT NULL CHECK (feasibility_score BETWEEN 1 AND 10),
  impact_score INTEGER NOT NULL CHECK (impact_score BETWEEN 1 AND 10),
  presentation_score INTEGER NOT NULL CHECK (presentation_score BETWEEN 1 AND 10),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, admin_id, round)
);

-- Enforce the inventory invariant even for databases created before the
-- sold-versus-capacity check became part of application validation.
CREATE TRIGGER IF NOT EXISTS ticket_capacity_insert_guard
BEFORE INSERT ON ticket_types
WHEN NEW.sold_quantity > NEW.capacity
BEGIN
  SELECT RAISE(ABORT, 'sold inventory exceeds capacity');
END;

CREATE TRIGGER IF NOT EXISTS ticket_capacity_update_guard
BEFORE UPDATE OF capacity, sold_quantity ON ticket_types
WHEN NEW.sold_quantity > NEW.capacity
BEGIN
  SELECT RAISE(ABORT, 'sold inventory exceeds capacity');
END;

-- Secure applicant access and programme configuration
CREATE TABLE IF NOT EXISTS launch_team_accounts (
  team_id INTEGER PRIMARY KEY REFERENCES launch_teams(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  last_login_at TEXT,
  password_changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS launch_applicant_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL REFERENCES launch_teams(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_launch_applicant_sessions_hash ON launch_applicant_sessions(token_hash);

CREATE TABLE IF NOT EXISTS launch_program_settings (
  program_id INTEGER PRIMARY KEY REFERENCES launch_programs(id) ON DELETE CASCADE,
  minimum_team_size INTEGER NOT NULL DEFAULT 2 CHECK (minimum_team_size BETWEEN 1 AND 10),
  maximum_team_size INTEGER NOT NULL DEFAULT 5 CHECK (maximum_team_size BETWEEN 1 AND 10),
  application_capacity INTEGER NOT NULL DEFAULT 5000 CHECK (application_capacity > 0),
  innovation_weight INTEGER NOT NULL DEFAULT 25 CHECK (innovation_weight BETWEEN 0 AND 100),
  feasibility_weight INTEGER NOT NULL DEFAULT 25 CHECK (feasibility_weight BETWEEN 0 AND 100),
  impact_weight INTEGER NOT NULL DEFAULT 25 CHECK (impact_weight BETWEEN 0 AND 100),
  presentation_weight INTEGER NOT NULL DEFAULT 25 CHECK (presentation_weight BETWEEN 0 AND 100),
  applications_enabled INTEGER NOT NULL DEFAULT 1 CHECK (applications_enabled IN (0,1)),
  results_public INTEGER NOT NULL DEFAULT 0 CHECK (results_public IN (0,1)),
  rules_version TEXT NOT NULL DEFAULT '2026.1',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Versioned legal documents and applicant acceptance records
CREATE TABLE IF NOT EXISTS legal_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','retired')),
  effective_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slug, version)
);

CREATE TABLE IF NOT EXISTS legal_acceptances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL REFERENCES launch_teams(id) ON DELETE CASCADE,
  legal_document_id INTEGER NOT NULL REFERENCES legal_documents(id) ON DELETE RESTRICT,
  accepted_by_email TEXT NOT NULL,
  ip_hash TEXT NOT NULL DEFAULT '',
  user_agent_hash TEXT NOT NULL DEFAULT '',
  accepted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, legal_document_id)
);

-- Controlled application documents. File bytes remain outside SQLite and are
-- served only after applicant or organization authorization.
CREATE TABLE IF NOT EXISTS launch_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  program_id INTEGER NOT NULL REFERENCES launch_programs(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES launch_teams(id) ON DELETE CASCADE,
  partnership_id INTEGER REFERENCES launch_college_partnerships(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('pitch_deck','prototype','identity','student_proof','mou','institution_letter','evaluation_evidence','incubation_evidence','other')),
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  checksum_sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted','quarantined','rejected','deleted')),
  uploaded_by_type TEXT NOT NULL CHECK (uploaded_by_type IN ('applicant','admin')),
  uploaded_by_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (team_id IS NOT NULL OR partnership_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_launch_documents_team ON launch_documents(team_id, created_at);
CREATE INDEX IF NOT EXISTS idx_launch_documents_partnership ON launch_documents(partnership_id, created_at);

-- Detailed eligibility and review decisions supplement scored evaluations.
CREATE TABLE IF NOT EXISTS launch_team_reviews (
  team_id INTEGER PRIMARY KEY REFERENCES launch_teams(id) ON DELETE CASCADE,
  student_status_verified INTEGER NOT NULL DEFAULT 0 CHECK (student_status_verified IN (0,1)),
  institution_verified INTEGER NOT NULL DEFAULT 0 CHECK (institution_verified IN (0,1)),
  team_size_verified INTEGER NOT NULL DEFAULT 0 CHECK (team_size_verified IN (0,1)),
  consent_verified INTEGER NOT NULL DEFAULT 0 CHECK (consent_verified IN (0,1)),
  originality_declared INTEGER NOT NULL DEFAULT 0 CHECK (originality_declared IN (0,1)),
  conflict_flag INTEGER NOT NULL DEFAULT 0 CHECK (conflict_flag IN (0,1)),
  decision TEXT NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending','eligible','ineligible','needs_information')),
  decision_reason TEXT NOT NULL DEFAULT '',
  reviewer_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Institutional partnership intake and readiness lifecycle
CREATE TABLE IF NOT EXISTS launch_partnership_inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  program_id INTEGER NOT NULL REFERENCES launch_programs(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  institution_type TEXT NOT NULL DEFAULT '',
  city_state TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_role TEXT NOT NULL,
  interest TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  consent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','qualified','meeting_scheduled','proposal','converted','declined')),
  owner_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS launch_partnership_readiness (
  partnership_id INTEGER PRIMARY KEY REFERENCES launch_college_partnerships(id) ON DELETE CASCADE,
  mou_received INTEGER NOT NULL DEFAULT 0 CHECK (mou_received IN (0,1)),
  faculty_lead_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (faculty_lead_confirmed IN (0,1)),
  student_lead_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (student_lead_confirmed IN (0,1)),
  venue_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (venue_confirmed IN (0,1)),
  av_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (av_confirmed IN (0,1)),
  internet_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (internet_confirmed IN (0,1)),
  volunteers_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (volunteers_confirmed IN (0,1)),
  communications_approved INTEGER NOT NULL DEFAULT 0 CHECK (communications_approved IN (0,1)),
  target_team_count INTEGER NOT NULL DEFAULT 0 CHECK (target_team_count >= 0),
  programme_date TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Mentors, judges, speakers, investors and incubation providers
CREATE TABLE IF NOT EXISTS launch_experts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  program_id INTEGER NOT NULL REFERENCES launch_programs(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expert_type TEXT NOT NULL CHECK (expert_type IN ('mentor','judge','speaker','investor','incubator','grant_provider')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  organization_name TEXT NOT NULL DEFAULT '',
  designation TEXT NOT NULL DEFAULT '',
  expertise TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect','invited','confirmed','declined','completed','inactive')),
  conflict_declared INTEGER NOT NULL DEFAULT 0 CHECK (conflict_declared IN (0,1)),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(program_id, email, expert_type)
);

CREATE INDEX IF NOT EXISTS idx_launch_experts_program_type ON launch_experts(program_id, expert_type, status);

-- Flagship agenda, pitch allocation and live results
CREATE TABLE IF NOT EXISTS launch_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL REFERENCES launch_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('registration','briefing','workshop','mentoring','jury_review','keynote','panel','pitch','expo','awards','networking','other')),
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  venue TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft','scheduled','live','completed','cancelled')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS launch_pitch_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES launch_sessions(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES launch_teams(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  starts_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 8 CHECK (duration_minutes BETWEEN 1 AND 120),
  room TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','checked_in','presenting','completed','no_show','cancelled')),
  result TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pending','advanced','not_advanced','winner','runner_up')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, team_id),
  UNIQUE(session_id, sequence_number)
);

CREATE TABLE IF NOT EXISTS launch_expert_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expert_id INTEGER NOT NULL REFERENCES launch_experts(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES launch_teams(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES launch_sessions(id) ON DELETE CASCADE,
  assignment_role TEXT NOT NULL CHECK (assignment_role IN ('mentor','judge','speaker','panelist','investor_reviewer','incubation_contact')),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','accepted','completed','declined')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (team_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Post-programme incubation, investor and grant follow-through
CREATE TABLE IF NOT EXISTS launch_referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  team_id INTEGER NOT NULL REFERENCES launch_teams(id) ON DELETE CASCADE,
  expert_id INTEGER REFERENCES launch_experts(id) ON DELETE SET NULL,
  referral_type TEXT NOT NULL CHECK (referral_type IN ('mentor','incubator','investor','grant','customer','other')),
  provider_name TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','introduced','meeting_scheduled','in_review','accepted','declined','completed')),
  next_action TEXT NOT NULL DEFAULT '',
  next_action_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS launch_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL REFERENCES launch_teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','blocked','cancelled')),
  evidence_url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Optional MFA for privileged administrator accounts
CREATE TABLE IF NOT EXISTS admin_mfa (
  admin_id INTEGER PRIMARY KEY REFERENCES admins(id) ON DELETE CASCADE,
  secret_encrypted TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0,1)),
  recovery_codes_hash TEXT NOT NULL DEFAULT '[]',
  confirmed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
