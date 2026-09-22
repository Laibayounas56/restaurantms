# 🍽️ Restaurant Management System (RestaurantMS)

A modern full-stack Restaurant Management System built with **Next.js 16 (App Router, TypeScript)** and **Supabase (PostgreSQL + Auth + RLS)** for the Software Project Management (SPM) course.

---

## 🧪 Hardcoded Test Credentials (Testing & Demo)

For evaluation and testing purposes, the system provides pre-configured hardcoded accounts:

| Role | Email | Password | Access / Capabilities |
|------|-------|----------|-----------------------|
| **Admin** | `admin@restaurant.com` | `admin123` | KPI Dashboard, Menu/Products CRUD, Inventory & Stock Movement, Staff & Shift Management, Salaries, Expense Tracking, Business Reports |
| **Waiter** | `waiter@restaurant.com` | `waiter123` | Mobile-first POS order taking, Table selection (1–20), Live order tracking, Status updates |

> 💡 **Quick Login:** On the login page (`/login`), click **"⚡ Login"** next to Admin or Waiter to instantly authenticate with hardcoded credentials!

---

## 🚀 Quick Setup Guide

### 1. Environment Configuration
Ensure `.env.local` exists in the `restaurant-app` folder with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Database Schema & Test Users Seeding
Run the SQL scripts in your **Supabase Dashboard → SQL Editor**:

1. **`supabase/migrations/001_initial_schema.sql`**
   Creates all tables, enums, automated inventory deduction triggers, profile auto-creation trigger, RLS policies, and seeds test accounts.
2. **`supabase/migrations/002_seed_test_users.sql`** *(Optional if already run with initial schema)*
   Seeds or updates the hardcoded test accounts (`admin@restaurant.com` and `waiter@restaurant.com`) with passwords `admin123` and `waiter123`.

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Key Features

- **Auth & Role-Based Access Control:** Secure routes (`/admin/*` and `/waiter/*`) with Supabase Auth and Server Middleware.
- **Admin Management Portal:**
  - Real-time KPIs (Today's Revenue, Orders, Active Staff, Low-Stock Alerts).
  - Menu & Product management with category filters and availability toggle.
  - Inventory tracking with low-stock badges and automatic stock deduction on completed orders.
  - Employee directory, shift scheduler, and salary disbursement logs.
  - Expense logging and financial profit/loss analytics.
- **Waiter POS Interface:**
  - Interactive table grid (Tables 1 to 20).
  - Fast categorized menu item selector with live order basket.
  - Live order tracking with real-time status badges (Pending, Accepted, Completed, Rejected).
