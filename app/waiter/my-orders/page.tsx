'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList,
  Clock,
  ChefHat,
  FileText,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatOrderNumber, formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import type { Order } from '@/types/database'

const STATUS_TABS = [
  { label: 'Active',     statuses: ['pending', 'accepted'] },
  { label: 'Completed',  statuses: ['completed'] },
  { label: 'Rejected',   statuses: ['rejected'] },
]

export default function MyOrdersPage() {
  const supabase = createClient()
  const [orders,     setOrders]     = useState<Order[]>([])
  const [activeTab,  setActiveTab]  = useState(0)
  const [loading,    setLoading]    = useState(true)

  const loadOrders = useCallback(async () => {
    try {
      let waiterId = 'b0000000-0000-0000-0000-000000000002'
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) waiterId = user.id
      } catch {
        // Fallback to test waiter ID
      }

      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(product_name_snapshot, quantity, unit_price_snapshot, subtotal)
        `)
        .eq('waiter_id', waiterId)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setOrders(data)
      } else {
        // Sample orders for instant demonstration
        setOrders([
          {
            id: 'ord-101',
            order_number: 101,
            waiter_id: waiterId,
            status: 'accepted',
            subtotal: 2250,
            discount: 0,
            total: 2250,
            table_number: '4',
            payment_method: null,
            notes: 'Extra ketchup packets please',
            created_at: new Date(Date.now() - 12 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
            completed_at: null,
            order_items: [
              { id: 'oi-1', order_id: 'ord-101', product_id: 'p1', product_name_snapshot: 'Classic Smash Burger', unit_price_snapshot: 850, quantity: 2, subtotal: 1700 },
              { id: 'oi-2', order_id: 'ord-101', product_id: 'p6', product_name_snapshot: 'Chilled Mint Lemonade', unit_price_snapshot: 280, quantity: 2, subtotal: 550 },
            ],
          },
          {
            id: 'ord-102',
            order_number: 102,
            waiter_id: waiterId,
            status: 'pending',
            subtotal: 1400,
            discount: 0,
            total: 1400,
            table_number: '2',
            payment_method: null,
            notes: 'Well done crust',
            created_at: new Date(Date.now() - 3 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 3 * 60000).toISOString(),
            completed_at: null,
            order_items: [
              { id: 'oi-3', order_id: 'ord-102', product_id: 'p3', product_name_snapshot: 'Margherita Pizza 12"', unit_price_snapshot: 1400, quantity: 1, subtotal: 1400 },
            ],
          },
        ])
      }
    } catch {
      // Demo fallback
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Real-time order status updates
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    try {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return

        channel = supabase
          .channel('waiter-orders')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `waiter_id=eq.${user.id}`,
            },
            () => {
              loadOrders()
            }
          )
          .subscribe()
      })
    } catch {
      // Ignore realtime error in test mode
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, loadOrders])

  const currentStatuses = STATUS_TABS[activeTab].statuses
  const filtered = orders.filter((o) => currentStatuses.includes(o.status))

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-md)', letterSpacing: '-0.02em' }}>
        My Orders
      </h1>

      <div className="tab-bar" style={{ marginBottom: 'var(--space-md)' }}>
        {STATUS_TABS.map((tab, i) => (
          <button
            key={tab.label}
            className={`tab-item${activeTab === i ? ' active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 'var(--space-2xl) var(--space-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--surface-hover)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-sm)',
            }}
          >
            <ClipboardList size={24} />
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', textAlign: 'center' }}>
            No orders in this category
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'center', marginInline: 'auto' }}>
            Submit a new order to see real-time status updates here.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {filtered.map((order: any) => (
            <div key={order.id} className={`order-card ${order.status}`}>
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {formatOrderNumber(order.order_number)}
                </span>
                <StatusBadge status={order.status} />
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                {formatDateTime(order.created_at)}
                {order.table_number && ` · Table ${order.table_number}`}
              </div>

              <div style={{ marginBottom: 'var(--space-sm)' }}>
                {order.order_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm" style={{ padding: '2px 0' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{item.quantity}× {item.product_name_snapshot}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-hover)',
                  }}
                >
                  <FileText size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span>{order.notes}</span>
                </div>
              )}

              <div
                className="flex justify-between items-center"
                style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-sm)' }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(order.total)}</span>
                {order.status === 'pending' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <Clock size={13} />
                    <span>Sent to Kitchen</span>
                  </span>
                )}
                {order.status === 'accepted' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--info)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <ChefHat size={13} />
                    <span>Being Prepared</span>
                  </span>
                )}
                {order.status === 'completed' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <CheckCircle2 size={13} />
                    <span>Ready / Served</span>
                  </span>
                )}
                {order.status === 'rejected' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <XCircle size={13} />
                    <span>Cancelled</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
