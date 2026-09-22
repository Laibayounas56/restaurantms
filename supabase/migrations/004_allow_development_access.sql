-- ============================================================
-- 004_allow_development_access.sql
-- Run this in Supabase SQL Editor to allow direct saving from the app!
-- It ensures that data added from the website saves directly
-- into public.employees, public.products, public.orders, etc.
-- and appears in your Supabase Table Editor immediately.
-- ============================================================

-- 1. Grant table & sequence privileges to anon, authenticated, and service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, postgres;

-- Explicit grants for every table to guarantee access
GRANT ALL ON TABLE public.inventory_items    TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.employees          TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.products           TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.product_categories TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.stock_movements    TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.orders             TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.order_items        TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.expenses           TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.expense_categories TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.shifts             TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.salary_payments    TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.profiles           TO anon, authenticated, service_role, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role, postgres;

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

