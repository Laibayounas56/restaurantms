export type UserRole = 'admin' | 'waiter'
export type OrderStatus = 'pending' | 'accepted' | 'completed' | 'rejected'
export type PaymentMethod = 'cash' | 'card' | 'other'
export type StockMovementType = 'IN' | 'OUT'
export type SalaryType = 'monthly' | 'daily' | 'per_shift'
export type SalaryPaymentStatus = 'pending' | 'paid'
export type ShiftStatus = 'scheduled' | 'completed' | 'missed'

export interface Profile {
  id: string
  name: string
  username: string
  role: UserRole
  employee_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: string
  name: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  image_url: string | null
  category_id: string | null
  selling_price: number
  cost_price: number | null
  is_available: boolean
  created_at: string
  updated_at: string
  // Joins
  product_categories?: ProductCategory | null
}

export interface InventoryItem {
  id: string
  name: string
  category: string | null
  unit: string
  current_quantity: number
  minimum_quantity: number
  purchase_price: number | null
  supplier_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Computed
  is_low_stock?: boolean
}

export interface StockMovement {
  id: string
  inventory_item_id: string
  type: StockMovementType
  quantity: number
  previous_quantity: number
  new_quantity: number
  reason: string | null
  notes: string | null
  performed_by: string | null
  created_at: string
  // Joins
  inventory_items?: Pick<InventoryItem, 'id' | 'name' | 'unit'> | null
  profiles?: Pick<Profile, 'id' | 'name'> | null
}

export interface Order {
  id: string
  order_number: number
  waiter_id: string
  status: OrderStatus
  payment_method: PaymentMethod | null
  subtotal: number
  discount: number
  total: number
  notes: string | null
  table_number: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  // Joins
  profiles?: Pick<Profile, 'id' | 'name'> | null
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name_snapshot: string
  unit_price_snapshot: number
  quantity: number
  subtotal: number
  // Joins
  products?: Pick<Product, 'id' | 'name' | 'image_url'> | null
}

export interface Employee {
  id: string
  name: string
  phone: string | null
  role: string
  joining_date: string | null
  salary_type: SalaryType
  salary_amount: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Shift {
  id: string
  employee_id: string
  date: string
  start_time: string
  end_time: string
  status: ShiftStatus
  notes: string | null
  created_at: string
  // Joins
  employees?: Pick<Employee, 'id' | 'name' | 'role'> | null
}

export interface SalaryPayment {
  id: string
  employee_id: string
  amount: number
  period_start: string
  period_end: string
  payment_date: string | null
  status: SalaryPaymentStatus
  notes: string | null
  created_at: string
  // Joins
  employees?: Pick<Employee, 'id' | 'name'> | null
}

export interface ExpenseCategory {
  id: string
  name: string
  is_default: boolean
  created_at: string
}

export interface Expense {
  id: string
  category_id: string | null
  amount: number
  date: string
  description: string | null
  attachment_url: string | null
  created_by: string | null
  created_at: string
  // Joins
  expense_categories?: Pick<ExpenseCategory, 'id' | 'name'> | null
  profiles?: Pick<Profile, 'id' | 'name'> | null
}

// ─── Report Types ──────────────────────────────────────────────────────────

export interface SalesReportData {
  total_sales: number
  order_count: number
  avg_order_value: number
  payment_breakdown: { method: string; count: number; total: number }[]
  top_products: { product_name: string; qty_sold: number; revenue: number }[]
  daily_sales: { date: string; total: number }[]
}

export interface ExpenseReportData {
  total_expenses: number
  by_category: { category: string; total: number }[]
  by_date: { date: string; total: number }[]
}

export interface ProfitReportData {
  total_revenue: number
  total_product_cost: number
  total_expenses: number
  estimated_profit: number | null
  has_complete_cost_data: boolean
}

export interface StockReportData {
  items: {
    item: InventoryItem
    stock_in: number
    stock_out: number
  }[]
  low_stock_count: number
}
