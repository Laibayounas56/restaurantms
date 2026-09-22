'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Receipt, User, Clock, ArrowRight, Trash2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { formatCurrency, formatOrderNumber, formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Modal'

const TABS = [
  { label: 'Pending',   statuses: ['pending'] },
  { label: 'Accepted',  statuses: ['accepted'] },
  { label: 'Completed', statuses: ['completed'] },
  { label: 'Rejected',  statuses: ['rejected'] },
  { label: 'All',       statuses: ['pending', 'accepted', 'completed', 'rejected'] },
]

export default function AdminOrdersPage() {
  const supabase   = createClient()
  const { success, error: showError } = useToast()
  const [orders,   setOrders]   = useState<any[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; order: any | null }>({
    open: false,
    order: null,
  })

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select(`*, profiles(name), order_items(product_name_snapshot, quantity, subtotal)`)
        .order('created_at', { ascending: false })
      setOrders(data ?? [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { loadOrders() }, [loadOrders])

  // Realtime subscription for new/updated orders
  useEffect(() => {
    let channel: any = null
    try {
      channel = supabase
        .channel('admin-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadOrders)
        .subscribe()
    } catch {
      // Realtime fallback
    }
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [supabase, loadOrders])

  const handleQuickAccept = async (orderId: string, orderNum: number) => {
    try {
      const { error } = await supabase.from('orders').update({ status: 'accepted' }).eq('id', orderId)
      if (error) throw error
      success(`Order #${formatOrderNumber(orderNum)} accepted!`)
      loadOrders()
    } catch (err: any) {
      showError(err.message ?? 'Failed to accept order')
    }
  }

  const handleDeleteOrder = async () => {
    if (!deleteDialog.order) return
    try {
      await supabase.from('order_items').delete().eq('order_id', deleteDialog.order.id)
      const { error } = await supabase.from('orders').delete().eq('id', deleteDialog.order.id)
      if (error) throw error
      success(`Order ${formatOrderNumber(deleteDialog.order.order_number)} deleted`)
      setDeleteDialog({ open: false, order: null })
      loadOrders()
    } catch (err: any) {
      showError(err.message ?? 'Failed to delete order')
    }
  }

  const filtered = orders.filter((o) => TABS[activeTab].statuses.includes(o.status))
  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage incoming and completed restaurant orders</p>
        </div>
        {pendingCount > 0 && (
          <span className="badge badge-warning" style={{ fontSize: '0.8125rem', padding: '6px 12px' }}>
            {pendingCount} pending
          </span>
        )}
      </div>

      <div className="tab-bar" style={{ marginBottom: 'var(--space-lg)' }}>
        {TABS.map((tab, i) => {
          const count = orders.filter((o) =>
            tab.statuses.includes(o.status)
          ).length
          return (
            <button
              key={tab.label}
              className={`tab-item${activeTab === i ? ' active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {tab.label}
              {count > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    background: activeTab === i ? 'var(--primary)' : 'var(--bg-elevated)',
                    color: activeTab === i ? '#fff' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-full)',
                    padding: '1px 7px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {[...Array(4)].map((_, i) => (
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-sm)',
              color: 'var(--text-muted)',
            }}
          >
            <Receipt size={24} />
          </div>
          <div className="empty-state-title" style={{ fontWeight: 600, textAlign: 'center' }}>
            No orders in this category
          </div>
          <div
            className="empty-state-desc"
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              marginTop: 4,
              textAlign: 'center',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Orders will appear here automatically when waiters submit them.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {filtered.map((order) => (
            <div key={order.id} className={`order-card ${order.status}`}>
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                <div className="flex items-center gap-sm">
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatOrderNumber(order.order_number)}</span>
                  <StatusBadge status={order.status} />
                  {order.table_number && (
                    <span className="badge badge-default">Table {order.table_number}</span>
                  )}
                </div>
                <div className="flex items-center gap-xs">
                  {order.status === 'pending' && (
                    <button
                      className="btn btn-success btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px' }}
                      title="Quick accept order"
                      onClick={() => handleQuickAccept(order.id, order.order_number)}
                    >
                      <Check size={13} />
                      <span>Accept</span>
                    </button>
                  )}
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>View</span>
                    <ArrowRight size={13} />
                  </Link>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)', padding: '4px 8px', display: 'inline-flex', alignItems: 'center' }}
                    title="Delete order permanently"
                    onClick={() => setDeleteDialog({ open: true, order })}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-md text-sm text-secondary" style={{ marginBottom: 'var(--space-sm)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={13} style={{ color: 'var(--text-muted)' }} />
                  <span>{order.profiles?.name ?? '—'}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                  <span>{formatDateTime(order.created_at)}</span>
                </span>
              </div>

              <div style={{ marginBottom: 'var(--space-sm)' }}>
                {order.order_items?.slice(0, 3).map((item: any, idx: number) => (
                  <span key={idx} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginRight: 12 }}>
                    {item.quantity}× {item.product_name_snapshot}
                  </span>
                ))}
                {(order.order_items?.length ?? 0) > 3 && (
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    +{order.order_items.length - 3} more
                  </span>
                )}
              </div>

              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {formatCurrency(order.total)}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, order: null })}
        onConfirm={handleDeleteOrder}
        title="Delete Order"
        message={`Are you sure you want to permanently delete order ${formatOrderNumber(deleteDialog.order?.order_number ?? 0)}? All related order items will be removed.`}
        confirmLabel="Delete Order"
      />
    </div>
  )
}
