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
