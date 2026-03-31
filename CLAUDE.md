# CLAUDE.md — HostelPro Project Intelligence

## Project Overview
HostelPro is a hostel and auberge management SaaS platform targeting Moroccan and North African property owners. It provides full operational control: room management, reservations, guest CRM, financial tracking, housekeeping, analytics, and a public booking page.

## Tech Stack
- **Framework:** Next.js 14 (App Router, Server Components, Server Actions)
- **Database & Auth:** Supabase (PostgreSQL, Auth, RLS, Realtime, Storage)
- **Styling:** Tailwind CSS 3.4+
- **UI Library:** shadcn/ui
- **Charts:** Recharts
- **PDF:** jsPDF + jspdf-autotable
- **Forms:** React Hook Form + Zod
- **Dates:** date-fns (with `fr` locale)
- **State:** React Context + useReducer for complex state, `nuqs` for URL state
- **Icons:** Lucide React
- **Deployment:** Vercel

## Project Structure
```
src/
├── app/
│   ├── (auth)/          # Login, register, forgot-password (centered layout)
│   ├── (dashboard)/     # All authenticated routes (sidebar layout)
│   │   ├── page.tsx             # Daily briefing dashboard
│   │   ├── calendar/            # Availability grid
│   │   ├── reservations/        # Booking management
│   │   ├── guests/              # Guest directory + profiles
│   │   ├── rooms/               # Room/bed configuration
│   │   ├── finances/            # Payments, expenses, reports
│   │   ├── operations/          # Housekeeping, maintenance, inventory
│   │   ├── analytics/           # Business intelligence
│   │   └── settings/            # Property, team, rates, extras
│   └── book/[slug]/     # Public booking page (no auth)
├── components/
│   ├── ui/              # shadcn/ui primitives (DO NOT edit directly)
│   ├── layout/          # Sidebar, TopBar, MobileNav, Breadcrumbs
│   ├── dashboard/       # Dashboard-specific widgets
│   ├── calendar/        # Availability grid components
│   ├── reservations/    # Booking forms, check-in/out flows
│   ├── guests/          # Guest forms, profiles, fiche police
│   ├── rooms/           # Room cards, forms, bed layout
│   ├── finances/        # Payment/expense forms, charts, invoice PDF
│   ├── analytics/       # Analytics charts and widgets
│   └── shared/          # Reusable: DataTable, EmptyState, CurrencyDisplay, etc.
├── lib/
│   ├── supabase/        # client.ts, server.ts, admin.ts, middleware.ts
│   ├── utils/           # currency.ts, dates.ts, pricing.ts, pdf.ts, occupancy.ts
│   ├── hooks/           # useOrganization, useRealtime, useRooms, etc.
│   ├── actions/         # Server Actions per domain
│   └── constants/       # Enums, option lists, static data
├── types/
│   └── index.ts         # All TypeScript types mirroring DB schema
└── middleware.ts        # Auth guard + org resolution
```

## Architecture Rules

### Data Flow
- All database mutations go through **Server Actions** in `src/lib/actions/`.
- Server Actions use the **server Supabase client** (`src/lib/supabase/server.ts`).
- Client components use the **browser Supabase client** only for reads and realtime subscriptions.
- Never expose the service role key to the client. The admin client is server-only.
- Every Server Action must validate input with **Zod** before touching the database.

### Multi-Tenancy & Security
- Every table has an `organization_id` column.
- Every table has **RLS enabled** — no exceptions.
- Base RLS pattern: user can only access rows where `organization_id` matches their profile's `organization_id`.
- Always filter by `organization_id` in queries even though RLS is the safety net — defense in depth.
- The current user's `organization_id` is resolved in middleware and available via the `useOrganization()` hook (client) or extracted from the session in Server Actions.

### Authentication
- Supabase Auth with email + password.
- Session managed via `@supabase/ssr` with cookie-based auth.
- Middleware in `src/middleware.ts` protects all `/(dashboard)` routes.
- After signup, user goes through an onboarding flow to create their organization.

## Coding Standards

### TypeScript
- **Strict mode ON** — no `any` types unless absolutely unavoidable (and add a comment explaining why).
- Define all database row types in `src/types/index.ts` as `type` (not `interface`) mirroring Supabase schema.
- Use discriminated unions for status fields: `type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'`.
- Prefer `unknown` over `any` for error catching.

### Components
- Use **Server Components by default**. Only add `"use client"` when the component needs interactivity (event handlers, hooks, browser APIs).
- Client components should be as small and leaf-level as possible — push `"use client"` down the tree.
- Every component gets its own file. No multi-component files except for tightly coupled pairs (e.g., `Dialog` + `DialogTrigger`).
- Props types defined at the top of each component file, named `{ComponentName}Props`.
- Use **named exports** for components, not default exports — except for Next.js page/layout files which require default exports.

### Naming Conventions
- Files: `kebab-case.tsx` for components, `camelCase.ts` for utilities and hooks.
- Components: `PascalCase`.
- Hooks: `useCamelCase`.
- Server Actions: `camelCase` verbs — `createReservation`, `updateRoomStatus`, `deleteExpense`.
- Database columns: `snake_case` (matching PostgreSQL convention).
- TypeScript types: `PascalCase` — `Reservation`, `Guest`, `Room`, `Payment`.
- Constants: `SCREAMING_SNAKE_CASE` for true constants, `camelCase` for config objects.
- CSS classes: Tailwind utilities only. No custom CSS files except for global reset in `globals.css`.

### Server Actions Pattern
```typescript
// src/lib/actions/reservations.ts
"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createReservationSchema = z.object({
  guest_id: z.string().uuid(),
  room_id: z.string().uuid(),
  check_in_date: z.string(),
  check_out_date: z.string(),
  // ... all fields validated
});

export async function createReservation(formData: FormData) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const validated = createReservationSchema.parse(Object.fromEntries(formData));

  const { data, error } = await supabase
    .from("reservations")
    .insert({ ...validated, organization_id: user.user_metadata.organization_id })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/reservations");
  return data;
}
```

### Form Pattern
```typescript
// Always use React Hook Form + Zod resolver
const form = useForm<ReservationFormValues>({
  resolver: zodResolver(reservationSchema),
  defaultValues: { ... },
});
```

### Error Handling
- Server Actions: throw errors, let error boundaries catch them. For expected validation errors, return `{ error: string }` objects.
- Client: wrap async operations in try/catch. Show errors via toast notifications (shadcn `sonner` or `toast`).
- Never silently swallow errors. Always log to console in development.
- Use Supabase `.single()` when expecting exactly one row — it throws if 0 or 2+ rows returned.

## Design System

### Colors (Tailwind Config)
```
Primary:       teal-600 (#0D9488) → teal-700 (#0F766E) for hover
Secondary:     amber-500 (#F59E0B)
Background:    stone-50 (#FAFAF9)
Surface:       white (#FFFFFF)
Border:        stone-200 (#E7E5E3)
Text Primary:  stone-900 (#1C1917)
Text Secondary: stone-500 (#78716C)
Success:       emerald-500 (#10B981)
Warning:       amber-500 (#F59E0B)
Danger:        red-500 (#EF4444)
Info:          blue-500 (#3B82F6)
```

### Typography
- Headings: `DM Sans` (Google Fonts), font-weight 600-700
- Body: `Inter` (Google Fonts), font-weight 400-500
- Monospace (for codes, IDs): `JetBrains Mono`

### Spacing & Layout
- Cards: `rounded-xl`, `shadow-sm`, `border border-stone-200`, `p-6`
- Modals: `rounded-2xl`, centered, max-width `max-w-lg` for forms
- Page padding: `p-6` desktop, `p-4` mobile
- Section gaps: `space-y-6` between sections
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` for card grids

### Status Colors (Consistent Everywhere)
```
Room/Bed Status:
  available    → white/stone-50 background
  occupied     → emerald-100 bg, emerald-700 text
  reserved     → amber-100 bg, amber-700 text
  maintenance  → red-100 bg, red-700 text
  blocked      → stone-200 bg, stone-600 text
  checkout_today → orange-100 bg, orange-700 text

Reservation Status:
  pending      → yellow badge
  confirmed    → blue badge
  checked_in   → green badge
  checked_out  → stone/gray badge
  cancelled    → red badge
  no_show      → red outline badge

Payment Status:
  paid         → green
  partial      → amber
  unpaid       → red
  refunded     → purple
```

### Responsive Rules
- Tables collapse to **card lists** on mobile (< 768px).
- Sidebar is **hidden on mobile**, replaced by bottom tab navigation with 5 tabs: Home, Calendar, + (New Booking FAB), Guests, More.
- Modals become **full-screen slide-overs** on mobile.
- Always test at 375px width (iPhone SE) as minimum.

### Empty States
Every list/table/grid must have a designed empty state with:
1. A relevant illustration or icon (use Lucide icons at 48px, `text-stone-300`)
2. A headline: "Pas encore de réservations"
3. A description: "Créez votre première réservation pour commencer"
4. A CTA button linking to the creation flow

### Loading States
- Use **skeleton loaders** (shadcn `Skeleton` component) for all data-dependent content.
- Never show a blank screen while data loads.
- Suspense boundaries at the page level with skeleton fallbacks.

## Currency & Locale

### Currency Display
- Always display amounts in **MAD** (Moroccan Dirham).
- Format: `1 234,50 MAD` (French number formatting — spaces for thousands, comma for decimals).
- Helper function in `src/lib/utils/currency.ts`:
```typescript
export function formatMAD(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
  }).format(amount);
}
```

### Date Display
- Format: `dd/MM/yyyy` for dates, `dd/MM/yyyy HH:mm` for timestamps.
- Use `date-fns` with `fr` locale for relative dates ("il y a 2 heures").
- Week starts on **Monday**.

### Language
- All UI labels, buttons, messages, placeholders are in **French**.
- Error messages in French.
- Guest-facing booking page supports French and English (toggle).

## Database Conventions

### Supabase Specifics
- Use `gen_random_uuid()` for default UUID primary keys.
- Add `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ DEFAULT now()` to every table.
- Create a trigger to auto-update `updated_at` on row modification:
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
- Use `text` over `varchar` — PostgreSQL handles them identically.
- Use `numeric` for money — never `float` or `real`.
- Arrays (`text[]`) for simple lists like amenities and tags. JSONB for complex nested data.
- Foreign keys always have `ON DELETE` behavior defined (usually `CASCADE` for child records, `SET NULL` for optional references).

### Naming
- Tables: plural `snake_case` — `reservations`, `reservation_rooms`, `housekeeping_tasks`.
- Columns: `snake_case` — `check_in_date`, `organization_id`, `is_active`.
- Junction tables: `parent_child` — `reservation_rooms`, `reservation_extras`, `organization_members`.
- Foreign keys: `referenced_table_singular_id` — `guest_id`, `room_id`, `organization_id`.
- Indexes: `idx_tablename_columnname` — `idx_reservations_check_in_date`.

### Required Indexes
```sql
-- Always index organization_id for RLS performance
CREATE INDEX idx_[table]_org ON [table](organization_id);

-- Date-range queries on reservations
CREATE INDEX idx_reservations_dates ON reservations(organization_id, check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(organization_id, status);

-- Guest search
CREATE INDEX idx_guests_name ON guests(organization_id, last_name, first_name);
CREATE INDEX idx_guests_phone ON guests(organization_id, phone);

-- Financial queries
CREATE INDEX idx_payments_date ON payments(organization_id, payment_date);
CREATE INDEX idx_expenses_date ON expenses(organization_id, expense_date);
```

## Key Business Logic

### Reservation Lifecycle
```
pending → confirmed → checked_in → checked_out
           ↓                         
         cancelled                  
           ↓
         no_show (if check_in_date passed without check-in)
```
- A reservation can only be checked in on or after `check_in_date`.
- Checking out auto-creates a housekeeping task for the room.
- Cancellation after check-in is not allowed — use early checkout instead.

### Room Availability Logic
A room is **unavailable** for a date range if ANY reservation overlaps it with status in `['confirmed', 'checked_in']`. Overlap check:
```sql
WHERE room_id = $1
  AND status IN ('confirmed', 'checked_in')
  AND check_in_date < $3  -- requested check_out
  AND check_out_date > $2  -- requested check_in
```

### Pricing Calculation
1. Start with room's `base_price`.
2. Check `room_rate_overrides` for specific date overrides → use if exists.
3. Check `rate_periods` for seasonal multiplier → apply to base price.
4. Per-night price may vary across the stay if it spans multiple rate periods.
5. `total_amount` = sum of per-night rates × nights.

### Occupancy Rate
```
occupancy_rate = (occupied_units / total_available_units) × 100
```
- For private rooms: 1 room = 1 unit.
- For dorm rooms: each bed = 1 unit.
- Exclude rooms/beds with status `maintenance` or `blocked` from total.

## Git Conventions
- Branch naming: `feature/room-management`, `fix/reservation-overlap`, `chore/db-indexes`.
- Commit messages: conventional commits — `feat: add check-in flow`, `fix: occupancy calculation for dorms`, `chore: add indexes to reservations table`.
- Keep commits atomic — one logical change per commit.

## Testing Approach
- Validate all Zod schemas with edge cases.
- Test Server Actions with various inputs including missing fields and invalid data.
- Test RLS policies by attempting cross-organization access.
- Test availability overlap logic extensively — this is the most critical business rule.
- Manual testing at 375px width for every new screen.

## Common Gotchas
- Always use `.maybeSingle()` instead of `.single()` when a row might not exist (e.g., looking up an optional override).
- Supabase `auth.getUser()` returns `{ data: { user } }` — always destructure correctly.
- When using `revalidatePath`, pass the exact path that needs refreshing.
- `date-fns` `format` needs the `fr` locale imported separately: `import { fr } from "date-fns/locale"`.
- Tailwind `peer` and `group` modifiers don't work across Server/Client component boundaries.
- shadcn `Dialog` in mobile should use `Drawer` component from `vaul` instead for better UX.
- Supabase Realtime requires the table to have `REPLICA IDENTITY FULL` set for UPDATE events to include old data.

## Performance Rules
- Use `loading.tsx` files in every route group for instant navigation feedback.
- Implement pagination on all list pages — never load more than 50 rows at once.
- Use Supabase's `.select("id, name, status")` to fetch only needed columns.
- Cache financial aggregations in `daily_revenue_cache` — don't compute on every dashboard load.
- Images in Supabase Storage: compress and resize before upload, serve via Supabase CDN.
- Use `next/dynamic` for heavy components like charts — don't include in initial bundle.
