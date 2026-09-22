import type { Metadata } from 'next'
import Link from 'next/link'
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Receipt,
  AlertTriangle,
  Users,
  CheckCircle2,
  ArrowRight,
  User,
  LayoutGrid,
  CheckCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatOrderNumber } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Dashboard — RestaurantMS',
}

// Disable caching so dashboard always reflects live data
export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const todayStart = `${today}T00:00:00.000Z`
  const todayEnd = `${today}T23:59:59.999Z`

  try {
    const [
      { data: completedOrders },
      { data: pendingOrders },
      { data: expenses },
      { data: lowStockItems },
      { data: activeEmployees },
      { data: recentOrders },
    ] = await Promise.all([
      // Today's completed orders
      supabase
        .from('orders')
        .select('total')
        .eq('status', 'completed')
        .gte('completed_at', todayStart)
        .lte('completed_at', todayEnd),

      // Pending & accepted orders
      supabase
        .from('orders')
        .select('id, order_number, status, total, notes, table_number, created_at, profiles(name)')
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: true }),

      // Today's expenses
      supabase
        .from('expenses')
        .select('amount')
        .eq('date', today),

      // Low stock items
      supabase
        .from('inventory_items')
        .select('id, name, current_quantity, minimum_quantity, unit')
        .eq('is_active', true)
        .filter('current_quantity', 'lte', 'minimum_quantity'),

      // Active employees (employees with shifts scheduled today)
      supabase
        .from('shifts')
        .select('employee_id')
        .eq('date', today)
        .eq('status', 'scheduled'),

      // Recent incoming orders for dashboard
      supabase
        .from('orders')
        .select(`
          id, order_number, status, total, notes, table_number, created_at,
          profiles(name),
          order_items(product_name_snapshot, quantity, unit_price_snapshot, subtotal)
        `)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const todaySales = completedOrders?.reduce((sum, o) => sum + o.total, 0) ?? 0
    const todayExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0
    const completedCount = completedOrders?.length ?? 0
    const pendingCount = pendingOrders?.filter((o) => o.status === 'pending').length ?? 0
    const lowStockCount = lowStockItems?.length ?? 0
    const activeStaff = new Set(activeEmployees?.map((s) => s.employee_id)).size

    return {
      todaySales,
      todayExpenses,
      completedCount,
      pendingCount,
      lowStockCount,
      activeStaff,
      recentOrders: recentOrders ?? [],
      lowStockItems: lowStockItems ?? [],
    }
  } catch {
    // Fallback data if DB error
    return {
      todaySales: 0,
      todayExpenses: 0,
      completedCount: 0,
      pendingCount: 0,
      lowStockCount: 0,
      activeStaff: 0,
      recentOrders: [],
      lowStockItems: [],
    }
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  const stats = [
    {
      label: "Today's Sales",
      value: formatCurrency(data.todaySales),
      icon: DollarSign,
      iconColor: 'var(--primary)',
      id: 'stat-sales',
    },
    {
      label: "Today's Orders",
      value: data.completedCount,
      icon: ShoppingBag,
      iconColor: 'var(--success)',
      id: 'stat-orders',
    },
    {
      label: 'Pending Orders',
      value: data.pendingCount,
      icon: Clock,
      iconColor: data.pendingCount > 0 ? 'var(--warning)' : 'var(--text-muted)',
      id: 'stat-pending',
      highlight: data.pendingCount > 0,
    },
    {
      label: "Today's Expenses",
      value: formatCurrency(data.todayExpenses),
      icon: Receipt,
      iconColor: 'var(--danger)',
      id: 'stat-expenses',
    },
    {
      label: 'Low Stock Items',
      value: data.lowStockCount,
      icon: AlertTriangle,
      iconColor: data.lowStockCount > 0 ? 'var(--warning)' : 'var(--text-muted)',
      id: 'stat-low-stock',
      highlight: data.lowStockCount > 0,
    },
    {
      label: 'Active Staff',
      value: data.activeStaff,
      icon: Users,
      iconColor: 'var(--info)',
      id: 'stat-staff',
    },
  ]

  return (
    <div className="admin-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-PK', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Live Feed</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.id}
              id={stat.id}
              className="stat-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-md) var(--space-lg)',
                ...(stat.highlight
                  ? { borderColor: 'var(--warning)', boxShadow: '0 0 12px hsla(42,95%,52%,0.15)' }
                  : {}),
              }}
            >
              <div>
                <div className="stat-label" style={{ marginBottom: 4 }}>{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.iconColor,
                  flexShrink: 0,
                }}
              >
                <Icon size={22} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="admin-dashboard-grid">
        {/* Incoming Orders */}
        <div>
          <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Incoming Orders</h2>
            <span className="live-dot" />
            {data.recentOrders.length > 0 && (
              <span className="badge badge-warning">{data.recentOrders.length}</span>
            )}
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: 'var(--space-2xl) var(--space-md)' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--primary-muted)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-sm)',
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <div className="empty-state-title" style={{ fontSize: '1rem', fontWeight: 600 }}>All Caught Up</div>
                <div className="empty-state-desc">New orders submitted by waiters will appear here live.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {data.recentOrders.map((order: any) => (
                <div key={order.id} className={`order-card ${order.status}`}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                    <div className="flex items-center gap-sm">
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {formatOrderNumber(order.order_number)}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span>View</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  <div className="flex gap-md text-sm text-secondary" style={{ marginBottom: 'var(--space-sm)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{order.profiles?.name ?? 'Unknown'}</span>
                    </span>
                    {order.table_number && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <LayoutGrid size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>Table {order.table_number}</span>
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>
                        {new Date(order.created_at).toLocaleTimeString('en-PK', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                  </div>

                  {order.notes && (
                    <div className="order-notes" style={{ marginBottom: 'var(--space-sm)' }}>
                      Note: {order.notes}
                    </div>
                  )}

                  <div
                    className="flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-sm)' }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {formatCurrency(order.total)}
                    </span>
                    <div className="flex gap-sm">
                      {order.status === 'pending' && (
                        <Link href={`/admin/orders/${order.id}`} className="btn btn-success btn-sm">
                          Accept
                        </Link>
                      )}
                      {(order.status === 'pending' || order.status === 'accepted') && (
                        <Link href={`/admin/orders/${order.id}`} className="btn btn-primary btn-sm">
                          Complete
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Sidebar */}
        <div>
          <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Low Stock Alert</h2>
          </div>

          {data.lowStockItems.length === 0 ? (
            <div className="card card-sm">
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-lg)',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCheck size={24} style={{ color: 'var(--success)' }} />
                <span>All inventory stock levels OK</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {data.lowStockItems.map((item: any) => (
                <div
                  key={item.id}
                  className="card card-sm"
                  style={{ borderColor: 'var(--warning)', background: 'var(--surface-hover)' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2, color: 'var(--text-primary)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--danger)', fontWeight: 600 }}>
                    {item.current_quantity} {item.unit} remaining
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Min required: {item.minimum_quantity} {item.unit}
                  </div>
                </div>
              ))}
              <Link
                href="/admin/inventory"
                className="btn btn-secondary btn-sm"
                style={{ textAlign: 'center', marginTop: 4 }}
              >
                Manage Inventory
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
