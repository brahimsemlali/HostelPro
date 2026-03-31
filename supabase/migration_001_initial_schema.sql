-- ============================================================
-- HostelPro — Initial Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ---- Auto-update updated_at trigger ----
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  address text,
  city text,
  phone text,
  email text,
  logo_url text,
  currency text NOT NULL DEFAULT 'MAD',
  timezone text NOT NULL DEFAULT 'Africa/Casablanca',
  tax_sejour_rate numeric NOT NULL DEFAULT 0,
  subscription_tier text NOT NULL DEFAULT 'free',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  role text NOT NULL DEFAULT 'owner',
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_profiles_org ON profiles(organization_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Utilisateur')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FLOORS
-- ============================================================
CREATE TABLE IF NOT EXISTS floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER floors_updated_at
  BEFORE UPDATE ON floors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_floors_org ON floors(organization_id);

ALTER TABLE floors ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  floor_id uuid REFERENCES floors(id) ON DELETE SET NULL,
  name text NOT NULL,
  room_number text NOT NULL,
  type text NOT NULL DEFAULT 'private_double',
  base_price numeric NOT NULL DEFAULT 0,
  max_occupancy integer NOT NULL DEFAULT 2,
  bed_count integer NOT NULL DEFAULT 1,
  amenities text[] NOT NULL DEFAULT '{}',
  photos text[] NOT NULL DEFAULT '{}',
  description text,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_rooms_org ON rooms(organization_id);
CREATE INDEX idx_rooms_status ON rooms(organization_id, status);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BEDS
-- ============================================================
CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label text NOT NULL,
  type text NOT NULL DEFAULT 'single',
  base_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER beds_updated_at
  BEFORE UPDATE ON beds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_beds_org ON beds(organization_id);
CREATE INDEX idx_beds_room ON beds(room_id);

ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- GUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  nationality text,
  id_type text,
  id_number text,
  id_photo_url text,
  date_of_birth date,
  gender text,
  address text,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  total_stays integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  last_stay_at date,
  marketing_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_guests_org ON guests(organization_id);
CREATE INDEX idx_guests_name ON guests(organization_id, last_name, first_name);
CREATE INDEX idx_guests_phone ON guests(organization_id, phone);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RESERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  confirmation_code text UNIQUE NOT NULL,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'confirmed',
  source text NOT NULL DEFAULT 'direct',
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  actual_check_in timestamptz,
  actual_check_out timestamptz,
  nights integer NOT NULL DEFAULT 1,
  adults integer NOT NULL DEFAULT 1,
  children integer NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  balance_due numeric NOT NULL DEFAULT 0,
  commission_rate numeric,
  commission_amount numeric,
  special_requests text,
  internal_notes text,
  cancellation_reason text,
  group_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_reservations_org ON reservations(organization_id);
CREATE INDEX idx_reservations_dates ON reservations(organization_id, check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(organization_id, status);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations REPLICA IDENTITY FULL;

-- ============================================================
-- RESERVATION_ROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS reservation_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  bed_id uuid REFERENCES beds(id) ON DELETE SET NULL,
  rate_per_night numeric NOT NULL DEFAULT 0,
  guest_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservation_rooms_res ON reservation_rooms(reservation_id);
CREATE INDEX idx_reservation_rooms_room ON reservation_rooms(room_id);

ALTER TABLE reservation_rooms ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'MAD',
  original_currency text,
  exchange_rate numeric,
  method text NOT NULL DEFAULT 'cash',
  type text NOT NULL DEFAULT 'booking_payment',
  reference text,
  notes text,
  received_by uuid NOT NULL REFERENCES profiles(id),
  payment_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_date ON payments(organization_id, payment_date);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  subcategory text,
  description text NOT NULL,
  amount numeric NOT NULL,
  vendor text,
  receipt_url text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_period text,
  recorded_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_expenses_org ON expenses(organization_id);
CREATE INDEX idx_expenses_date ON expenses(organization_id, expense_date);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HOUSEKEEPING_TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'daily_clean',
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'normal',
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  reported_issues text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_housekeeping_org ON housekeeping_tasks(organization_id);
CREATE INDEX idx_housekeeping_status ON housekeeping_tasks(organization_id, status);

ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MAINTENANCE_REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'reported',
  photos text[] NOT NULL DEFAULT '{}',
  reported_by uuid NOT NULL REFERENCES profiles(id),
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  estimated_cost numeric,
  actual_cost numeric,
  scheduled_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER maintenance_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_maintenance_org ON maintenance_requests(organization_id);

ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RATE_PERIODS
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  multiplier numeric NOT NULL DEFAULT 1.0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER rate_periods_updated_at
  BEFORE UPDATE ON rate_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_rate_periods_org ON rate_periods(organization_id);

ALTER TABLE rate_periods ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Helper function: get current user's organization_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: users can only see/modify their own org
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = get_user_org_id());

CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (id = get_user_org_id());

-- Profiles: users can read all profiles in their org, update their own
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (organization_id = get_user_org_id() OR id = auth.uid());

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid() OR organization_id = get_user_org_id());

-- Generic org isolation policy for all other tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'floors', 'rooms', 'beds', 'guests', 'reservations',
    'payments', 'expenses', 'housekeeping_tasks',
    'maintenance_requests', 'notifications', 'rate_periods'
  ])
  LOOP
    EXECUTE format('
      CREATE POLICY "org_isolation_%s" ON %I
      FOR ALL USING (organization_id = get_user_org_id());
    ', t, t);
  END LOOP;
END $$;

-- reservation_rooms: accessible if the parent reservation is in the user's org
CREATE POLICY "rr_org_isolation" ON reservation_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
        AND r.organization_id = get_user_org_id()
    )
  );
