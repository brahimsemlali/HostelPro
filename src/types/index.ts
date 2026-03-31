// ============================================================
// HostelPro TypeScript Types — mirrors Supabase DB schema
// ============================================================

// ---- Enums / Discriminated Unions ----

export type SubscriptionTier = "free" | "pro" | "multi";
export type UserRole = "owner" | "manager" | "receptionist" | "housekeeper";
export type RoomType =
  | "private_single"
  | "private_double"
  | "private_twin"
  | "suite"
  | "dorm"
  | "camping";
export type RoomStatus = "active" | "maintenance" | "blocked" | "retired";
export type BedType = "single" | "bunk_top" | "bunk_bottom";
export type BedStatus = "active" | "maintenance" | "blocked";
export type IdType =
  | "passport"
  | "cin"
  | "carte_sejour"
  | "driving_license";
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show";
export type BookingSource =
  | "direct"
  | "walk_in"
  | "booking_com"
  | "hostelworld"
  | "airbnb"
  | "whatsapp"
  | "phone"
  | "website"
  | "other";
export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "mobile_money"
  | "online"
  | "other";
export type PaymentType =
  | "booking_payment"
  | "deposit"
  | "extra_charge"
  | "refund";
export type ExpenseCategory =
  | "supplies"
  | "utilities"
  | "maintenance"
  | "food_beverage"
  | "wages"
  | "marketing"
  | "commission"
  | "tax"
  | "insurance"
  | "rent"
  | "equipment"
  | "other";
export type HousekeepingType =
  | "checkout_clean"
  | "daily_clean"
  | "deep_clean"
  | "turndown";
export type HousekeepingStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "inspected";
export type Priority = "low" | "normal" | "high" | "urgent" | "critical";
export type MaintenanceCategory =
  | "plumbing"
  | "electrical"
  | "furniture"
  | "appliance"
  | "structural"
  | "other";
export type MaintenanceStatus =
  | "reported"
  | "scheduled"
  | "in_progress"
  | "completed";
export type NotificationType =
  | "new_booking"
  | "check_in_today"
  | "payment_received"
  | "low_stock"
  | "maintenance"
  | "review";
export type ExtraCategory =
  | "meal"
  | "transport"
  | "activity"
  | "laundry"
  | "minibar"
  | "other";

// ---- Database Row Types ----

export type Organization = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  currency: string;
  timezone: string;
  tax_sejour_rate: number;
  subscription_tier: SubscriptionTier;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  organization_id: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Floor = {
  id: string;
  organization_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: string;
  organization_id: string;
  floor_id: string | null;
  name: string;
  room_number: string;
  type: RoomType;
  base_price: number;
  max_occupancy: number;
  bed_count: number;
  amenities: string[];
  photos: string[];
  description: string | null;
  status: RoomStatus;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Relations (joined)
  floor?: Floor;
  beds?: Bed[];
};

export type Bed = {
  id: string;
  room_id: string;
  organization_id: string;
  label: string;
  type: BedType;
  base_price: number;
  status: BedStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Guest = {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  id_type: IdType | null;
  id_number: string | null;
  id_photo_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  tags: string[];
  total_stays: number;
  total_spent: number;
  last_stay_at: string | null;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
};

export type Reservation = {
  id: string;
  organization_id: string;
  confirmation_code: string;
  guest_id: string;
  status: ReservationStatus;
  source: BookingSource;
  check_in_date: string;
  check_out_date: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  nights: number;
  adults: number;
  children: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  commission_rate: number | null;
  commission_amount: number | null;
  special_requests: string | null;
  internal_notes: string | null;
  cancellation_reason: string | null;
  group_id: string | null;
  created_at: string;
  updated_at: string;
  // Relations (joined)
  guest?: Guest;
  reservation_rooms?: ReservationRoom[];
  payments?: Payment[];
};

export type ReservationRoom = {
  id: string;
  reservation_id: string;
  room_id: string;
  bed_id: string | null;
  rate_per_night: number;
  guest_name: string | null;
  created_at: string;
  // Relations
  room?: Room;
  bed?: Bed;
};

export type Payment = {
  id: string;
  organization_id: string;
  reservation_id: string | null;
  guest_id: string | null;
  amount: number;
  currency: string;
  original_currency: string | null;
  exchange_rate: number | null;
  method: PaymentMethod;
  type: PaymentType;
  reference: string | null;
  notes: string | null;
  received_by: string;
  payment_date: string;
  created_at: string;
};

export type Expense = {
  id: string;
  organization_id: string;
  category: ExpenseCategory;
  subcategory: string | null;
  description: string;
  amount: number;
  vendor: string | null;
  receipt_url: string | null;
  expense_date: string;
  is_recurring: boolean;
  recurrence_period: string | null;
  recorded_by: string;
  created_at: string;
  updated_at: string;
};

export type HousekeepingTask = {
  id: string;
  organization_id: string;
  room_id: string;
  type: HousekeepingType;
  status: HousekeepingStatus;
  priority: Priority;
  assigned_to: string | null;
  notes: string | null;
  reported_issues: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  // Relations
  room?: Room;
  assignee?: Profile;
};

export type MaintenanceRequest = {
  id: string;
  organization_id: string;
  room_id: string | null;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: Priority;
  status: MaintenanceStatus;
  photos: string[];
  reported_by: string;
  assigned_to: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  scheduled_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryItem = {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  cost_per_unit: number | null;
  last_restocked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Extra = {
  id: string;
  organization_id: string;
  name: string;
  category: ExtraCategory;
  price: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ReservationExtra = {
  id: string;
  reservation_id: string;
  extra_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  date: string;
  notes: string | null;
  created_at: string;
  // Relations
  extra?: Extra;
};

export type Notification = {
  id: string;
  organization_id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
};

export type RatePeriod = {
  id: string;
  organization_id: string;
  name: string;
  start_date: string;
  end_date: string;
  multiplier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DailyRevenueCache = {
  id: string;
  organization_id: string;
  date: string;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  occupancy_rate: number;
  total_check_ins: number;
  total_check_outs: number;
  average_daily_rate: number;
  revpab: number;
};

// ---- Database generic type (for createClient<Database>()) ----
export type Database = {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> };
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      floors: { Row: Floor; Insert: Partial<Floor>; Update: Partial<Floor> };
      rooms: { Row: Room; Insert: Partial<Room>; Update: Partial<Room> };
      beds: { Row: Bed; Insert: Partial<Bed>; Update: Partial<Bed> };
      guests: { Row: Guest; Insert: Partial<Guest>; Update: Partial<Guest> };
      reservations: { Row: Reservation; Insert: Partial<Reservation>; Update: Partial<Reservation> };
      reservation_rooms: { Row: ReservationRoom; Insert: Partial<ReservationRoom>; Update: Partial<ReservationRoom> };
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> };
      housekeeping_tasks: { Row: HousekeepingTask; Insert: Partial<HousekeepingTask>; Update: Partial<HousekeepingTask> };
      maintenance_requests: { Row: MaintenanceRequest; Insert: Partial<MaintenanceRequest>; Update: Partial<MaintenanceRequest> };
      inventory_items: { Row: InventoryItem; Insert: Partial<InventoryItem>; Update: Partial<InventoryItem> };
      extras: { Row: Extra; Insert: Partial<Extra>; Update: Partial<Extra> };
      reservation_extras: { Row: ReservationExtra; Insert: Partial<ReservationExtra>; Update: Partial<ReservationExtra> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
      rate_periods: { Row: RatePeriod; Insert: Partial<RatePeriod>; Update: Partial<RatePeriod> };
      daily_revenue_cache: { Row: DailyRevenueCache; Insert: Partial<DailyRevenueCache>; Update: Partial<DailyRevenueCache> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
