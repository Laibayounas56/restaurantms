'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getDateRange, type DateRangePreset } from '@/lib/utils'
import {
  DollarSign,
  CheckCircle2,
  BarChart3,
  Receipt,
  FileText,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

type ReportTab = 'sales' | 'expenses' | 'profit' | 'stock'

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: 'Today',      value: 'today' },
  { label: 'This Week',  value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom',     value: 'custom' },
]

export default function AdminReportsPage() {
  const supabase = createClient()
  const [activeTab,   setActiveTab]   = useState<ReportTab>('sales')
  const [preset,      setPreset]      = useState<DateRangePreset>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd,   setCustomEnd]   = useState('')
  const [data,        setData]        = useState<any>(null)
  const [loading,     setLoading]     = useState(false)

  const range = getDateRange(preset, customStart, customEnd)

  const loadReport = useCallback(async () => {
    setLoading(true)
    const { start, end } = range
    const endOfDay = `${end}T23:59:59.999Z`
    const startOfDay = `${start}T00:00:00.000Z`

    try {
      if (activeTab === 'sales') {
        const { data: orders } = await supabase
          .from('orders')
          .select('total, payment_method, created_at, order_items(product_name_snapshot, quantity, unit_price_snapshot, subtotal)')
          .eq('status', 'completed')
          .gte('completed_at', startOfDay)
          .lte('completed_at', endOfDay)

        const total = orders?.reduce((s, o) => s + o.total, 0) ?? 0
        const count = orders?.length ?? 0
        const avg   = count > 0 ? total / count : 0

        // Payment breakdown
        const paymentMap: Record<string, { count: number; total: number }> = {}
        orders?.forEach((o) => {
          const m = o.payment_method ?? 'not specified'
          if (!paymentMap[m]) paymentMap[m] = { count: 0, total: 0 }
          paymentMap[m].count += 1
          paymentMap[m].total += o.total
        })

        // Top products
        const productMap: Record<string, { name: string; qty: number; revenue: number }> = {}
        orders?.forEach((o) => {
          (o as any).order_items?.forEach((item: any) => {
            if (!productMap[item.product_name_snapshot]) {
              productMap[item.product_name_snapshot] = { name: item.product_name_snapshot, qty: 0, revenue: 0 }
            }
            productMap[item.product_name_snapshot].qty += item.quantity
            productMap[item.product_name_snapshot].revenue += item.subtotal
          })
        })
        const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

        setData({ total, count, avg, paymentMap, topProducts })
      }

      if (activeTab === 'expenses') {
        const { data: exps } = await supabase
          .from('expenses')
          .select('amount, date, expense_categories(name)')
          .gte('date', start)
          .lte('date', end)
          .order('date')

        const total = exps?.reduce((s, e) => s + e.amount, 0) ?? 0
        const byCategory: Record<string, number> = {}
        exps?.forEach((e: any) => {
          const cat = e.expense_categories?.name ?? 'Uncategorized'
          byCategory[cat] = (byCategory[cat] ?? 0) + e.amount
        })

        setData({ total, count: exps?.length ?? 0, byCategory })
      }

      if (activeTab === 'profit') {
        const [{ data: orders }, { data: exps }, { data: products }] = await Promise.all([
          supabase
            .from('orders')
            .select('total, order_items(product_name_snapshot, quantity, unit_price_snapshot, subtotal)')
            .eq('status', 'completed')
            .gte('completed_at', startOfDay)
            .lte('completed_at', endOfDay),
          supabase.from('expenses').select('amount').gte('date', start).lte('date', end),
          supabase.from('products').select('name, selling_price, cost_price').not('cost_price', 'is', null),
        ])

        const revenue     = orders?.reduce((s, o) => s + o.total, 0) ?? 0
        const totalExpenses = exps?.reduce((s, e) => s + e.amount, 0) ?? 0

        // Build cost map from products
        const costMap: Record<string, number> = {}
        products?.forEach((p) => { if (p.cost_price != null) costMap[p.name] = p.cost_price / p.selling_price })

        let productCost = 0
        let hasMissingCost = false
        orders?.forEach((o) => {
          (o as any).order_items?.forEach((item: any) => {
            const ratio = costMap[item.product_name_snapshot]
            if (ratio !== undefined) {
              productCost += item.subtotal * ratio
            } else {
              hasMissingCost = true
            }
          })
        })

        const estimatedProfit = hasMissingCost ? null : revenue - productCost - totalExpenses

        setData({ revenue, productCost, totalExpenses, estimatedProfit, hasMissingCost })
      }

      if (activeTab === 'stock') {
        const { data: items } = await supabase
          .from('inventory_items')
          .select(`
            id, name, unit, current_quantity, minimum_quantity,
            stock_movements!inner(type, quantity, created_at)
          `)
          .eq('is_active', true)

        const stockData = (items ?? []).map((item: any) => {
          const movements = item.stock_movements.filter((m: any) => {
            const d = m.created_at.split('T')[0]
            return d >= start && d <= end
          })
          const stockIn  = movements.filter((m: any) => m.type === 'IN').reduce((s: number, m: any) => s + m.quantity, 0)
          const stockOut = movements.filter((m: any) => m.type === 'OUT').reduce((s: number, m: any) => s + m.quantity, 0)
          return { ...item, stockIn, stockOut, isLowStock: item.current_quantity <= item.minimum_quantity }
        })

        setData({ items: stockData, lowStockCount: stockData.filter((i: any) => i.isLowStock).length })
      }
    } finally {
      setLoading(false)
    }
  }, [supabase, activeTab, range.start, range.end])

  useEffect(() => { loadReport() }, [activeTab, preset, customStart, customEnd])

  return (
    <div className="admin-content">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 'var(--space-md)' }}>
        {(['sales', 'expenses', 'profit', 'stock'] as ReportTab[]).map((tab) => (
          <button key={tab} className={`tab-item${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Date Range */}
      <div className="card card-sm flex gap-sm" style={{ marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>Period:</span>
        {PRESETS.map((p) => (
          <button key={p.value}
            className={`btn btn-sm ${preset === p.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPreset(p.value)}>
            {p.label}
          </button>
        ))}
        {preset === 'custom' && (
          <>
            <input type="date" className="form-input" style={{ width: 'auto' }} value={customStart}
              onChange={(e) => setCustomStart(e.target.value)} />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input type="date" className="form-input" style={{ width: 'auto' }} value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)} />
          </>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {range.start} → {range.end}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : !data ? null : (
        <>
          {/* SALES REPORT */}
          {activeTab === 'sales' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div className="grid-3">
                <div className="stat-card">
                  <div className="stat-label">Total Sales</div>
                  <div className="stat-value">{formatCurrency(data.total)}</div>
                  <span className="stat-icon" style={{ color: 'var(--primary)' }}><DollarSign size={20} /></span>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Completed Orders</div>
                  <div className="stat-value">{data.count}</div>
                  <span className="stat-icon" style={{ color: 'var(--success)' }}><CheckCircle2 size={20} /></span>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Average Order</div>
                  <div className="stat-value">{formatCurrency(data.avg)}</div>
                  <span className="stat-icon" style={{ color: 'var(--info)' }}><BarChart3 size={20} /></span>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Top Products</h3>
                {data.topProducts.length === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                    <div style={{ color: 'var(--text-muted)' }}>No completed orders in this period</div>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
                      <tbody>
                        {data.topProducts.map((p: any) => (
                          <tr key={p.name}>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td>{p.qty}</td>
                            <td style={{ fontWeight: 700 }}>{formatCurrency(p.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {Object.keys(data.paymentMap).length > 0 && (
                <div className="card">
                  <h3 style={{ marginBottom: 'var(--space-md)' }}>Payment Methods</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(data.paymentMap).map(([method, val]: [string, any]) => (
                      <div key={method} className="flex justify-between items-center">
                        <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{method}</span>
                        <div className="flex gap-md">
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{val.count} orders</span>
                          <span style={{ fontWeight: 700 }}>{formatCurrency(val.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EXPENSES REPORT */}
          {activeTab === 'expenses' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div className="grid-2">
                <div className="stat-card">
                  <div className="stat-label">Total Expenses</div>
                  <div className="stat-value">{formatCurrency(data.total)}</div>
                  <span className="stat-icon" style={{ color: 'var(--danger)' }}><Receipt size={20} /></span>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Records</div>
                  <div className="stat-value">{data.count}</div>
                  <span className="stat-icon" style={{ color: 'var(--text-muted)' }}><FileText size={20} /></span>
                </div>
              </div>
              <div className="card">
                <h3 style={{ marginBottom: 'var(--space-md)' }}>By Category</h3>
                {Object.entries(data.byCategory).sort(([,a],[,b]) => (b as number)-(a as number)).map(([cat, amount]) => {
                  const pct = data.total > 0 ? ((amount as number) / data.total) * 100 : 0
                  return (
                    <div key={cat} style={{ marginBottom: 'var(--space-sm)' }}>
                      <div className="flex justify-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{cat}</span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(amount as number)}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* PROFIT REPORT */}
          {activeTab === 'profit' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {data.hasMissingCost && (
                <div
                  style={{
                    padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                    background: 'var(--warning-muted)', borderLeft: '4px solid var(--warning)',
                    fontSize: '0.875rem', color: 'var(--warning)',
                  }}
                >
                  Some products are missing cost price — profit calculation is estimated.
                </div>
              )}
              <div className="grid-2">
                <div className="stat-card">
                  <div className="stat-label">Revenue</div>
                  <div className="stat-value">{formatCurrency(data.revenue)}</div>
                  <span className="stat-icon" style={{ color: 'var(--primary)' }}><DollarSign size={20} /></span>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Product Cost</div>
                  <div className="stat-value">{formatCurrency(data.productCost)}</div>
                  <span className="stat-icon" style={{ color: 'var(--text-muted)' }}><ShoppingBag size={20} /></span>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Expenses</div>
                  <div className="stat-value">{formatCurrency(data.totalExpenses)}</div>
                  <span className="stat-icon" style={{ color: 'var(--danger)' }}><Receipt size={20} /></span>
                </div>
                <div className="stat-card" style={{ borderColor: 'var(--primary)' }}>
                  <div className="stat-label">Estimated Profit</div>
                  <div className="stat-value" style={{ color: data.estimatedProfit != null && data.estimatedProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {data.estimatedProfit != null ? formatCurrency(data.estimatedProfit) : 'N/A'}
                  </div>
                  <span className="stat-icon" style={{ color: 'var(--success)' }}><TrendingUp size={20} /></span>
                </div>
              </div>
            </div>
          )}

          {/* STOCK REPORT */}
          {activeTab === 'stock' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div className="stat-card" style={{ maxWidth: 240 }}>
                <div className="stat-label">Low Stock Items</div>
                <div className="stat-value">{data.lowStockCount}</div>
                <span className="stat-icon" style={{ color: 'var(--warning)' }}><AlertTriangle size={20} /></span>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Item</th><th>Current</th><th>In ({range.start} – {range.end})</th><th>Out</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.items.map((item: any) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td style={{ color: item.isLowStock ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 600 }}>
                          {item.current_quantity} {item.unit}
                        </td>
                        <td style={{ color: 'var(--success)' }}>+{item.stockIn} {item.unit}</td>
                        <td style={{ color: 'var(--danger)' }}>-{item.stockOut} {item.unit}</td>
                        <td>
                          {item.isLowStock
                            ? <span className="badge badge-danger">Low Stock</span>
                            : <span className="badge badge-success">OK</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
