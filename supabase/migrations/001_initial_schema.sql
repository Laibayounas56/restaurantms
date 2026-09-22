-- ============================================================
-- Restaurant Management System — Initial Schema
-- ============================================================

-- ─── ENUMS ───────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'waiter');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'completed', 'rejected');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'other');
CREATE TYPE stock_movement_type AS ENUM ('IN', 'OUT');
CREATE TYPE salary_type AS ENUM ('monthly', 'daily', 'per_shift');
CREATE TYPE salary_payment_status AS ENUM ('pending', 'paid');
CREATE TYPE shift_status AS ENUM ('scheduled', 'completed', 'missed');

-- ─── PROFILES ────────────────────────────────────────────────
-- Extends Supabase auth.users

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  role        user_role NOT NULL DEFAULT 'waiter',
  employee_id UUID,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PRODUCT CATEGORIES ──────────────────────────────────────

CREATE TABLE product_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PRODUCTS ────────────────────────────────────────────────

CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  category_id   UUID REFERENCES product_categories (id) ON DELETE SET NULL,
  selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
  cost_price    NUMERIC(10, 2) CHECK (cost_price >= 0),
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INVENTORY ITEMS ─────────────────────────────────────────

CREATE TABLE inventory_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  category          TEXT,
  unit              TEXT NOT NULL,
  current_quantity  NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  minimum_quantity  NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (minimum_quantity >= 0),
  purchase_price    NUMERIC(10, 2),
  supplier_name     TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── STOCK MOVEMENTS ─────────────────────────────────────────

CREATE TABLE stock_movements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id   UUID NOT NULL REFERENCES inventory_items (id) ON DELETE CASCADE,
  type                stock_movement_type NOT NULL,
  quantity            NUMERIC(10, 3) NOT NULL CHECK (quantity > 0),
  previous_quantity   NUMERIC(10, 3) NOT NULL,
  new_quantity        NUMERIC(10, 3) NOT NULL,
  reason              TEXT,
  notes               TEXT,
  performed_by        UUID REFERENCES profiles (id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ORDERS ──────────────────────────────────────────────────

CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number   SERIAL UNIQUE,
  waiter_id      UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
  status         order_status NOT NULL DEFAULT 'pending',
  payment_method payment_method,
  subtotal       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total          NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes          TEXT,
  table_number   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

-- ─── ORDER ITEMS ─────────────────────────────────────────────

CREATE TABLE order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id            UUID REFERENCES products (id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  unit_price_snapshot   NUMERIC(10, 2) NOT NULL,
  quantity              INT NOT NULL CHECK (quantity > 0),
  subtotal              NUMERIC(10, 2) NOT NULL
);

-- ─── EMPLOYEES ───────────────────────────────────────────────

CREATE TABLE employees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'Other',
  joining_date  DATE,
  salary_type   salary_type NOT NULL DEFAULT 'monthly',
  salary_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (salary_amount >= 0),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SHIFTS ──────────────────────────────────────────────────

CREATE TABLE shifts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  status       shift_status NOT NULL DEFAULT 'scheduled',
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SALARY PAYMENTS ─────────────────────────────────────────

CREATE TABLE salary_payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  payment_date  DATE,
  status        salary_payment_status NOT NULL DEFAULT 'pending',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── EXPENSE CATEGORIES ──────────────────────────────────────

CREATE TABLE expense_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── EXPENSES ────────────────────────────────────────────────

CREATE TABLE expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    UUID REFERENCES expense_categories (id) ON DELETE SET NULL,
  amount         NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  date           DATE NOT NULL,
  description    TEXT,
  attachment_url TEXT,
  created_by     UUID REFERENCES profiles (id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX idx_orders_status        ON orders (status);
CREATE INDEX idx_orders_waiter_id     ON orders (waiter_id);
CREATE INDEX idx_orders_created_at    ON orders (created_at);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_stock_movements_item ON stock_movements (inventory_item_id);
CREATE INDEX idx_stock_movements_date ON stock_movements (created_at);
CREATE INDEX idx_expenses_date        ON expenses (date);
CREATE INDEX idx_shifts_employee      ON shifts (employee_id);
CREATE INDEX idx_shifts_date          ON shifts (date);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at   BEFORE UPDATE ON profiles   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at   BEFORE UPDATE ON products   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_inventory_updated_at  BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at     BEFORE UPDATE ON orders     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employees_updated_at  BEFORE UPDATE ON employees  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── ATOMIC STOCK MOVEMENT FUNCTION ─────────────────────────

CREATE OR REPLACE FUNCTION record_stock_movement(
  p_item_id      UUID,
  p_type         stock_movement_type,
  p_quantity     NUMERIC,
  p_reason       TEXT,
  p_notes        TEXT,
  p_performed_by UUID
)
RETURNS stock_movements AS $$
DECLARE
  v_item     inventory_items%ROWTYPE;
  v_prev_qty NUMERIC;
  v_new_qty  NUMERIC;
  v_movement stock_movements%ROWTYPE;
BEGIN
  SELECT * INTO v_item FROM inventory_items WHERE id = p_item_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found';
  END IF;

  v_prev_qty := v_item.current_quantity;

  IF p_type = 'IN' THEN
    v_new_qty := v_prev_qty + p_quantity;
  ELSE
    IF p_quantity > v_prev_qty THEN
      RAISE EXCEPTION 'Stock out quantity (%) exceeds current stock (%)', p_quantity, v_prev_qty;
    END IF;
    v_new_qty := v_prev_qty - p_quantity;
  END IF;

  UPDATE inventory_items SET current_quantity = v_new_qty WHERE id = p_item_id;

  INSERT INTO stock_movements (
    inventory_item_id, type, quantity, previous_quantity, new_quantity, reason, notes, performed_by
  ) VALUES (
    p_item_id, p_type, p_quantity, v_prev_qty, v_new_qty, p_reason, p_notes, p_performed_by
  ) RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── PROFILE AUTO-CREATE TRIGGER ────────────────────────────
-- Creates a profile row when a new auth user is created

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'waiter')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── SEED DEFAULT DATA ───────────────────────────────────────

INSERT INTO product_categories (name) VALUES
  ('Burgers'), ('Pizza'), ('Fast Food'), ('Drinks'), ('Desserts'), ('Other');

INSERT INTO expense_categories (name, is_default) VALUES
  ('Rent', TRUE), ('Utilities', TRUE), ('Salaries', TRUE),
  ('Ingredients', TRUE), ('Maintenance', TRUE), ('Cleaning', TRUE),
  ('Equipment', TRUE), ('Transportation', TRUE), ('Other', TRUE);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses           ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "Users read own profile"    ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins read all profiles"  ON profiles FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Users update own profile"  ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins manage profiles"    ON profiles FOR ALL USING (get_my_role() = 'admin');

-- product_categories
CREATE POLICY "All users read categories" ON product_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage categories"  ON product_categories FOR ALL USING (get_my_role() = 'admin');

-- products
CREATE POLICY "All users read products"   ON products FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage products"    ON products FOR ALL USING (get_my_role() = 'admin');

-- inventory_items
CREATE POLICY "Admins manage inventory"   ON inventory_items FOR ALL USING (get_my_role() = 'admin');

-- stock_movements
CREATE POLICY "Admins manage stock"       ON stock_movements FOR ALL USING (get_my_role() = 'admin');

-- orders
CREATE POLICY "Waiters read own orders"   ON orders FOR SELECT USING (waiter_id = auth.uid());
CREATE POLICY "Waiters create orders"     ON orders FOR INSERT WITH CHECK (waiter_id = auth.uid() AND get_my_role() = 'waiter');
CREATE POLICY "Admins manage all orders"  ON orders FOR ALL USING (get_my_role() = 'admin');

-- order_items
CREATE POLICY "Waiters read own items"    ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.waiter_id = auth.uid())
);
CREATE POLICY "Waiters insert own items"  ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.waiter_id = auth.uid())
);
CREATE POLICY "Admins manage all items"   ON order_items FOR ALL USING (get_my_role() = 'admin');

-- employees
CREATE POLICY "Admins manage employees"   ON employees FOR ALL USING (get_my_role() = 'admin');

-- shifts
CREATE POLICY "Admins manage shifts"      ON shifts FOR ALL USING (get_my_role() = 'admin');

-- salary_payments
CREATE POLICY "Admins manage salaries"    ON salary_payments FOR ALL USING (get_my_role() = 'admin');

-- expense_categories
CREATE POLICY "All users read exp cats"   ON expense_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage exp cats"    ON expense_categories FOR ALL USING (get_my_role() = 'admin');

-- expenses
CREATE POLICY "Admins manage expenses"    ON expenses FOR ALL USING (get_my_role() = 'admin');

-- ─── SEED TEST USERS (Hardcoded Passwords for Testing & SPM Demo) ─────────────
-- Admin:  admin@restaurant.com  /  admin123
-- Waiter: waiter@restaurant.com /  waiter123

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_waiter_id UUID := 'b0000000-0000-0000-0000-000000000002';
BEGIN
  -- Admin User (admin@restaurant.com / admin123)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@restaurant.com') THEN
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
  ELSE
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@restaurant.com';
    UPDATE auth.users
    SET encrypted_password = crypt('admin123', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = '{"name":"Admin Manager","username":"admin","role":"admin"}'::jsonb
    WHERE id = v_admin_id;
  END IF;

  INSERT INTO profiles (id, name, username, role, is_active)
  VALUES (v_admin_id, 'Admin Manager', 'admin', 'admin', TRUE)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, username = 'admin', role = 'admin', is_active = TRUE;

  -- Waiter User (waiter@restaurant.com / waiter123)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'waiter@restaurant.com') THEN
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
  ELSE
    SELECT id INTO v_waiter_id FROM auth.users WHERE email = 'waiter@restaurant.com';
    UPDATE auth.users
    SET encrypted_password = crypt('waiter123', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = '{"name":"John Waiter","username":"waiter","role":"waiter"}'::jsonb
    WHERE id = v_waiter_id;
  END IF;

  INSERT INTO profiles (id, name, username, role, is_active)
  VALUES (v_waiter_id, 'John Waiter', 'waiter', 'waiter', TRUE)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, username = 'waiter', role = 'waiter', is_active = TRUE;

END $$;

