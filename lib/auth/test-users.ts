// ─── Test Credentials & Hardcoded Users for Testing & SPM Demos ───────────

export interface TestAccount {
  id: string
  label: string
  role: 'admin' | 'waiter'
  name: string
  username: string
  email: string
  password: string
  description: string
  badgeColor: string
}

export const TEST_ACCOUNTS: TestAccount[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    label: 'Admin',
    role: 'admin',
    name: 'Admin Manager',
    username: 'admin',
    email: 'admin@restaurant.com',
    password: 'admin123',
    description: 'Full access to Dashboard, Menu, Inventory, Staff, Salaries & Reports',
    badgeColor: '#f97316',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    label: 'Waiter',
    role: 'waiter',
    name: 'John Waiter',
    username: 'waiter',
    email: 'waiter@restaurant.com',
    password: 'waiter123',
    description: 'POS order taking, Table selection & Live order tracking',
    badgeColor: '#3b82f6',
  },
]

export const SEED_USERS_SQL = `-- ============================================================
-- Fix Permissions & Seed Test Users in Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Grant table & schema permissions to eliminate 'permission denied'
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 2. Seed auth.users + auth.identities + profiles
DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_waiter_id UUID := 'b0000000-0000-0000-0000-000000000002';
BEGIN
  -- Clean up prior incomplete entries
  DELETE FROM auth.identities WHERE user_id IN (v_admin_id, v_waiter_id) OR provider_id IN ('admin@restaurant.com', 'waiter@restaurant.com');
  DELETE FROM auth.users WHERE email IN ('admin@restaurant.com', 'waiter@restaurant.com');
  DELETE FROM profiles WHERE id IN (v_admin_id, v_waiter_id) OR username IN ('admin', 'waiter');

  -- A. Admin User (admin@restaurant.com / admin123)
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

  -- B. Waiter User (waiter@restaurant.com / waiter123)
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
`
