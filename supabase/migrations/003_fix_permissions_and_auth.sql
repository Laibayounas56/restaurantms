-- ============================================================
-- 003_fix_permissions_and_auth.sql
-- Fixes:
-- 1. "permission denied for table profiles / products / etc."
-- 2. "Database error finding user" in Supabase Auth
-- 3. Seeds hardcoded accounts:
--    - Admin:  admin@restaurant.com  /  admin123
--    - Waiter: waiter@restaurant.com /  waiter123
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. GRANT FULL SCHEMA & TABLE PRIVILEGES ──────────────────
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- ── 2. SEED AUTH USERS + IDENTITIES ───────────────────────────
DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_waiter_id UUID := 'b0000000-0000-0000-0000-000000000002';
BEGIN
  -- Clean up prior incomplete entries to avoid foreign key / identity mismatches
  DELETE FROM auth.identities WHERE user_id IN (v_admin_id, v_waiter_id) OR provider_id IN ('admin@restaurant.com', 'waiter@restaurant.com');
  DELETE FROM auth.users WHERE email IN ('admin@restaurant.com', 'waiter@restaurant.com');
  DELETE FROM profiles WHERE id IN (v_admin_id, v_waiter_id) OR username IN ('admin', 'waiter');

  -- A. Admin (admin@restaurant.com / admin123)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
    'admin@restaurant.com', crypt('admin123', gen_salt('bf')),
    NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Admin Manager","username":"admin","role":"admin"}'::jsonb,
    NOW(), NOW(), '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_admin_id, v_admin_id,
    jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@restaurant.com'),
    'email', v_admin_id::text, NOW(), NOW(), NOW()
  );

  INSERT INTO profiles (id, name, username, role, is_active)
  VALUES (v_admin_id, 'Admin Manager', 'admin', 'admin', TRUE)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, username = 'admin', role = 'admin', is_active = TRUE;

  -- B. Waiter (waiter@restaurant.com / waiter123)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_waiter_id, 'authenticated', 'authenticated',
    'waiter@restaurant.com', crypt('waiter123', gen_salt('bf')),
    NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"John Waiter","username":"waiter","role":"waiter"}'::jsonb,
    NOW(), NOW(), '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_waiter_id, v_waiter_id,
    jsonb_build_object('sub', v_waiter_id::text, 'email', 'waiter@restaurant.com'),
    'email', v_waiter_id::text, NOW(), NOW(), NOW()
  );

  INSERT INTO profiles (id, name, username, role, is_active)
  VALUES (v_waiter_id, 'John Waiter', 'waiter', 'waiter', TRUE)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, username = 'waiter', role = 'waiter', is_active = TRUE;

END $$;
