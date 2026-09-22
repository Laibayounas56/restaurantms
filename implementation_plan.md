# Restaurant Management System — Implementation Plan

A mobile-first responsive web application to replace paper-based restaurant operations. Built on **Next.js 14 (App Router)** and **Supabase** (Postgres + Auth + Realtime + Storage).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Realtime | Supabase Realtime (order notifications) |
| File Storage | Supabase Storage (product images, expense receipts) |
| Styling | Vanilla CSS (mobile-first, dark/light mode) |
| UI State | React Context + `useState` / `useReducer` |
| Icons | Lucide React |
| Charts | Recharts (for reports) |
| Fonts | Google Fonts — Inter |
| Hosting | Vercel (optional) |

---

## Project Structure

```
restaurant-app/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── admin/
│   │   ├── layout.tsx               ← Admin sidebar/nav layout
│   │   ├── page.tsx                 ← Dashboard
│   │   ├── orders/
│   │   │   ├── page.tsx             ← Order list (Pending/Active/Completed tabs)
│   │   │   └── [id]/page.tsx        ← Order detail
│   │   ├── products/
│   │   │   ├── page.tsx             ← Products list
│   │   │   ├── categories/page.tsx  ← Product categories
│   │   │   └── new/page.tsx         ← Add/edit product
│   │   ├── inventory/
│   │   │   ├── page.tsx             ← Current stock list
│   │   │   ├── stock-in/page.tsx
│   │   │   ├── stock-out/page.tsx
│   │   │   └── history/page.tsx
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   ├── shifts/page.tsx
│   │   │   └── salaries/page.tsx
│   │   ├── expenses/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   └── reports/
│   │       ├── sales/page.tsx
│   │       ├── expenses/page.tsx
│   │       ├── profit/page.tsx
│   │       ├── stock/page.tsx
│   │       └── employees/page.tsx
│   ├── waiter/
│   │   ├── layout.tsx               ← Waiter bottom-nav layout
│   │   ├── page.tsx                 ← Waiter Home
│   │   ├── new-order/page.tsx       ← Order creation screen
│   │   └── my-orders/page.tsx       ← Waiter's submitted orders
│   ├── api/
│   │   ├── orders/route.ts
│   │   ├── products/route.ts
│   │   ├── inventory/route.ts
│   │   ├── employees/route.ts
│   │   ├── expenses/route.ts
│   │   └── reports/route.ts
│   ├── layout.tsx                   ← Root layout (fonts, global CSS)
│   └── page.tsx                     ← Root redirect to /login
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Toast.tsx
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   ├── DashboardCard.tsx
│   │   ├── OrderCard.tsx
│   │   └── StatsChart.tsx
│   └── waiter/
│       ├── BottomNav.tsx
│       ├── ProductCard.tsx
│       └── CartDrawer.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                ← Browser client
│   │   ├── server.ts                ← Server-side client (cookies)
│   │   └── middleware.ts
│   ├── auth.ts                      ← Role helpers
│   └── utils.ts                     ← Formatting utilities (currency, dates)
├── types/
│   └── database.ts                  ← Full TypeScript types for all DB tables
├── middleware.ts                    ← Route protection & role redirect
├── styles/
│   └── globals.css                  ← Full design system (variables, typography, utils)
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql   ← All table definitions + RLS policies
```

---

## Database Schema (Supabase / PostgreSQL)

### Tables

```sql
-- Users table (extends Supabase auth.users)
profiles (id uuid PK, name, username, role enum('admin','waiter'), employee_id, is_active, created_at, updated_at)

-- Products
product_categories (id, name, created_at)
products (id, name, description, image_url, category_id FK, selling_price, cost_price nullable, is_available, created_at, updated_at)

-- Inventory
inventory_items (id, name, category, unit, current_quantity, minimum_quantity, purchase_price nullable, supplier_name, is_active, created_at, updated_at)
stock_movements (id, inventory_item_id FK, type enum('IN','OUT'), quantity, previous_quantity, new_quantity, reason, notes, performed_by FK profiles, created_at)

-- Orders
orders (id, order_number, waiter_id FK profiles, status enum('pending','accepted','completed','rejected'), payment_method enum('cash','card','other'), subtotal, discount, total, notes, table_number, created_at, updated_at, completed_at)
order_items (id, order_id FK, product_id FK, product_name_snapshot, unit_price_snapshot, quantity, subtotal)

-- Employees
employees (id, name, phone, role, joining_date, salary_type enum('monthly','daily','per_shift'), salary_amount, is_active, created_at, updated_at)
shifts (id, employee_id FK, date, start_time, end_time, status, created_at)
salary_payments (id, employee_id FK, amount, period_start, period_end, payment_date, status enum('pending','paid'), notes, created_at)

-- Expenses
expense_categories (id, name, is_default, created_at)
expenses (id, category_id FK, amount, date, description, attachment_url, created_by FK profiles, created_at)
```

### Row-Level Security (RLS) Policies

- **profiles**: Users can only read their own profile. Admin can read all.
- **orders**: Waiters can only see/create their own orders. Admins see all orders and can update status.
- **order_items**: Inherit from orders.
- **products**: Waiters can read available products only. Admins have full CRUD.
- **inventory_items / stock_movements**: Admin-only write. No waiter access.
- **employees / shifts / salary_payments**: Admin-only.
- **expenses / expense_categories**: Admin-only.
- **product_categories**: Admin write, waiter read.

---

## Authentication & Routing

- Supabase Auth handles session (JWT-based, stored in cookies via SSR).
- `middleware.ts` intercepts every request:
  - Unauthenticated → redirect to `/login`
  - Role `admin` → `/admin/...` routes allowed
  - Role `waiter` → `/waiter/...` routes allowed
  - Cross-role access → redirect to appropriate home

```
POST /login → Supabase signInWithPassword → read profile.role → redirect
```

---

## Feature Implementation Phases

### Phase 1 — Foundation (Setup + Auth)
- Initialize Next.js 14 project with App Router
- Configure Supabase project and environment variables
- Create database schema + RLS migration
- Implement login page (shared for admin + waiter)
- Implement role-based middleware + redirects
- Set up global CSS design system (CSS variables, typography, layout, utility classes)
- Set up Supabase client (browser + server + middleware)
- Build reusable UI components (Button, Card, Input, Modal, Toast, Badge)

### Phase 2 — Admin Dashboard
- Admin layout with sidebar navigation
- Dashboard page:
  - Today's Sales card
  - Today's Orders count
  - Pending Orders count
  - Today's Expenses
  - Estimated Profit (conditional on cost data)
  - Low Stock Items count
  - Active Staff count
- Real-time Incoming Orders section (Supabase Realtime subscription)
- Order card with Accept / Complete / Reject actions

### Phase 3 — Products & Categories
- Product Categories CRUD
- Products list page (search, filter by category)
- Add/Edit product form (name, price, cost, image upload, category, availability toggle)
- Soft-delete products (deactivation, not hard delete)

### Phase 4 — Inventory Management
- Inventory items list (with Low Stock highlighting)
- Add/Edit inventory item form
- Stock In form (item, quantity, price, date, notes → updates `current_quantity`)
- Stock Out form (item, quantity, reason, date, notes → validates quantity > 0)
- Stock Movement History (filterable by item / type / date range)
- Atomic quantity update via DB function/trigger

### Phase 5 — Order Management (Admin Side)
- Orders list with status tabs: Pending / Accepted / Completed / Rejected
- Order detail page (items, waiter, timestamps, total, notes)
- Status update buttons (Accept, Complete, Reject)
- Payment method selection on completion
- Completed orders feed into sales totals

### Phase 6 — Waiter Interface
- Waiter home page
- New Order screen:
  - Category filter tabs
  - Product grid (only available products)
  - Product search
  - Quantity +/- controls per product
  - Floating cart summary / drawer
  - Table number + notes fields
  - Submit Order button with validation
  - Order confirmation screen
- My Orders screen:
  - List of waiter's own orders with live status updates
  - Status badges (Pending / Accepted / Completed / Rejected)

### Phase 7 — Employee Management
- Employees list (CRUD)
- Add/Edit employee form (name, phone, role, joining date, salary type/amount)
- Shifts: create and assign shifts to employees
- Salaries: view salary info, record salary payment

### Phase 8 — Expense Management
- Expenses list (filterable by date, category, amount range)
- Add/Edit expense form (category, amount, date, description, optional receipt upload)
- Expense categories CRUD (with default categories pre-seeded)

### Phase 9 — Reports
- Date range selector (Today / This Week / This Month / Custom)
- Sales Report: total revenue, order count, avg order value, product breakdown, payment method chart
- Expense Report: total, by category pie chart, by date
- Profit Report: Revenue - Cost - Expenses = Estimated Profit (with warning if cost data missing)
- Stock Report: current stock, stock-in/out totals, low stock items, movement history
- Employee Report: employee list, assigned shifts, salary status

### Phase 10 — Polish & Real-time
- Supabase Realtime: admin dashboard auto-refreshes on new order (no polling)
- Toast notifications for all CRUD operations
- Confirmation dialogs for destructive actions (delete, reject order)
- Mobile responsiveness testing across all screens
- Loading states and skeleton screens
- Empty state illustrations

---

## Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| App Router vs Pages Router | **App Router** | Server Components, better layouts, built-in streaming |
| Auth strategy | **Supabase Auth + SSR cookies** | Secure, no token in localStorage, works with middleware |
| Order notifications | **Supabase Realtime** | Push new orders to admin dashboard instantly |
| Role enforcement | **Middleware + RLS** | Defense-in-depth: both route-level and DB-level |
| Price snapshot | **Store at order time in `order_items`** | Ensures historical accuracy |
| Soft delete | **`is_active` flag** | Preserves referential integrity for historical orders |
| Image storage | **Supabase Storage** | Unified with DB, easy signed URLs |
| Currency display | **Pakistani Rupees (Rs.)** | As specified in PRD |

---

## Open Questions

> [!IMPORTANT]
> Please review the following before I begin implementation:

1. **Supabase project**: Do you already have a Supabase project set up, or should I walk through creating one? I'll need the `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

2. **Admin account creation**: Should the first admin account be created via a seed script, or do you want a one-time setup/registration page for the admin?

3. **Realtime notifications**: Should new orders show a sound alert / browser notification in addition to the visual update on the admin dashboard?

4. **Product images**: Are product images required for the MVP, or can the image upload be deferred to a later phase?

5. **Currency**: The PRD uses `Rs.` (Pakistani Rupee). Should the currency symbol be configurable, or hardcoded for MVP?

---

## Verification Plan

### Automated Tests
- None required for MVP (SPM academic project) — manual testing of all 7 acceptance workflows from PRD Section 16.

### Manual Verification (7 Acceptance Workflows from PRD §16)
1. **Workflow 1**: Waiter logs in → creates order → submits → appears on admin dashboard with unique ID
2. **Workflow 2**: Admin logs in → views pending order → accepts → completes → appears in sales report
3. **Workflow 3**: Admin adds inventory item → stocks in → quantity increases → stocks out → history recorded
4. **Workflow 4**: Admin adds product → product visible on waiter's order screen
5. **Workflow 5**: Admin adds employee → assigns shift → views employee info
6. **Workflow 6**: Admin adds expense → expense appears in report
7. **Workflow 7**: Admin views reports with date range → sales, expenses, stock, estimated profit all display correctly
