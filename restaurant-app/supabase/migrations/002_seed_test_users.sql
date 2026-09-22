-- ============================================================
-- 002_seed_test_users.sql
-- Seeds hardcoded test accounts for testing and evaluation
-- 
-- Accounts created:
-- 1. Admin:  admin@restaurant.com  /  admin123
-- 2. Waiter: waiter@restaurant.com /  waiter123
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_waiter_id UUID := 'b0000000-0000-0000-0000-000000000002';
BEGIN
  -- ── 1. Admin User (admin@restaurant.com / admin123) ─────────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@restaurant.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      'admin@restaurant.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Admin Manager","username":"admin","role":"admin"}'::jsonb,
      NOW(),
      NOW(),
      '',
      ''
    );
  ELSE
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@restaurant.com';
    UPDATE auth.users
    SET encrypted_password = crypt('admin123', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = '{"name":"Admin Manager","username":"admin","role":"admin"}'::jsonb
    WHERE id = v_admin_id;
  END IF;

  -- Ensure Admin Profile exists and has role 'admin'
  INSERT INTO profiles (id, name, username, role, is_active)
  VALUES (v_admin_id, 'Admin Manager', 'admin', 'admin', TRUE)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    username = 'admin',
    role = 'admin',
    is_active = TRUE;

  -- ── 2. Waiter User (waiter@restaurant.com / waiter123) ───────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'waiter@restaurant.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_waiter_id,
      'authenticated',
      'authenticated',
      'waiter@restaurant.com',
      crypt('waiter123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"John Waiter","username":"waiter","role":"waiter"}'::jsonb,
      NOW(),
      NOW(),
      '',
      ''
    );
  ELSE
    SELECT id INTO v_waiter_id FROM auth.users WHERE email = 'waiter@restaurant.com';
    UPDATE auth.users
    SET encrypted_password = crypt('waiter123', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = '{"name":"John Waiter","username":"waiter","role":"waiter"}'::jsonb
    WHERE id = v_waiter_id;
  END IF;

  -- Ensure Waiter Profile exists and has role 'waiter'
  INSERT INTO profiles (id, name, username, role, is_active)
  VALUES (v_waiter_id, 'John Waiter', 'waiter', 'waiter', TRUE)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    username = 'waiter',
    role = 'waiter',
    is_active = TRUE;

END $$;
