-- ============================================================
-- 004_allow_development_access.sql
-- Run this in Supabase SQL Editor to allow direct saving from the app!
-- It ensures that data added from the website saves directly
-- into public.employees, public.products, public.orders, etc.
-- and appears in your Supabase Table Editor immediately.
-- ============================================================

-- 1. Grant table & sequence privileges to anon and authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 2. Disable Row Level Security (RLS) on all application tables
-- so requests from the web app are never blocked by missing auth tokens:
ALTER TABLE IF EXISTS employees          DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shifts             DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS salary_payments    DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_items    DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_movements    DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders             DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items        DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles           DISABLE ROW LEVEL SECURITY;

-- 3. Ensure default Admin and Waiter profiles exist in public.profiles
-- so foreign keys (such as orders.waiter_id) never fail:
INSERT INTO profiles (id, name, username, role, is_active)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Admin Manager', 'admin', 'admin', TRUE),
  ('b0000000-0000-0000-0000-000000000002', 'John Waiter', 'waiter', 'waiter', TRUE)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  username = EXCLUDED.username, 
  role = EXCLUDED.role, 
  is_active = TRUE;

