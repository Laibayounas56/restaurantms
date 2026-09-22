'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  X,
  FileText,
  Search,
  CreditCard,
  Banknote,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { formatCurrency, formatOrderNumber, formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Modal'

const PAYMENT_OPTIONS = [
  { value: 'cash',  label: 'Cash' },
  { value: 'card',  label: 'Card' },
  { value: 'other', label: 'Other' },
]

export default function OrderDetailPage() {
  const router   = useRouter()
  const routeParams = useParams()
  const orderId  = (routeParams?.id as string) || ''
  const supabase = createClient()
  const { success, error: showError } = useToast()

  const [order,        setOrder]        = useState<any>(null)
  const [loading,      setLoading]      = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; action: 'accept' | 'complete' | 'reject' | null
  }>({ open: false, action: null })
  const [deleteOrderDialog, setDeleteOrderDialog] = useState(false)

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false)
      return
    }
    try {
      let { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles(name, username),
          order_items(*, products(name, image_url))
        `)
        .eq('id', orderId)
        .single()

      if (error || !data) {
        // Fallback in case nested joins fail due to missing schema relations
        const fallback = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single()
        data = fallback.data
      }

      setOrder(data ?? null)
      if (data?.payment_method) setPaymentMethod(data.payment_method)
    } catch {
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [supabase, orderId])

  useEffect(() => { loadOrder() }, [loadOrder])

  const updateStatus = async (newStatus: string) => {
    if (!orderId) return
    setActionLoading(true)
    try {
      const updates: any = { status: newStatus }
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString()
        if (paymentMethod) updates.payment_method = paymentMethod
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)

      if (error) throw error

      success(`Order marked as ${newStatus}!`)
      loadOrder()
    } catch (err: any) {
      showError(err.message ?? 'Failed to update order')
    } finally {
      setActionLoading(false)
      setConfirmDialog({ open: false, action: null })
    }
  }

  const handleDeleteOrder = async () => {
    if (!orderId) return
    setActionLoading(true)
    try {
      await supabase.from('order_items').delete().eq('order_id', orderId)
      const { error } = await supabase.from('orders').delete().eq('id', orderId)
      if (error) throw error
      success(`Order ${formatOrderNumber(order?.order_number ?? 0)} deleted successfully`)
      router.push('/admin/orders')
    } catch (err: any) {
      showError(err.message ?? 'Failed to delete order')
      setActionLoading(false)
      setDeleteOrderDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-content">
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="admin-content">
        <div
          className="card"
          style={{
            padding: 'var(--space-2xl)',
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
            <Search size={24} />
          </div>
          <div className="empty-state-title" style={{ fontWeight: 600 }}>Order not found</div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => router.push('/admin/orders')}
            style={{ marginTop: 'var(--space-md)' }}
          >
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

  const ACTION_LABELS: Record<string, string> = {
    accept: 'Accept this order?',
    complete: 'Mark as completed and finalize bill?',
    reject: 'Reject and cancel this order?',
  }

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.back()}
            style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} />
            <span>Back to Orders</span>
          </button>
          <h1 className="page-title">
            Order {formatOrderNumber(order.order_number)}
          </h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="admin-dashboard-grid">
        {/* Order Items Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Order info */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem', fontWeight: 700 }}>Order Summary</h3>
            <div className="grid-2" style={{ gap: 'var(--space-sm)' }}>
              {[
                { label: 'Waiter',       value: order.profiles?.name ?? '—' },
                { label: 'Submitted',    value: formatDateTime(order.created_at) },
                { label: 'Table',        value: order.table_number ? `Table ${order.table_number}` : '—' },
                { label: 'Completed At', value: order.completed_at ? formatDateTime(order.completed_at) : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {label}
                  </div>
                  <div style={{ marginTop: 2, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
            {order.notes && (
              <div
                style={{
                  marginTop: 'var(--space-md)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <FileText size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>{order.notes}</span>
              </div>
            )}
          </div>

          {/* Order items */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem', fontWeight: 700 }}>Items Ordered</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {order.order_items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                  style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.quantity}× {item.product_name_snapshot}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {formatCurrency(item.unit_price_snapshot)} each
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>
            <div
              className="flex justify-between items-center"
              style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '2px solid var(--border-light)' }}
            >
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total Amount</span>
              <span style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--primary)' }}>
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar: Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem', fontWeight: 700 }}>Order Actions</h3>

            {order.status === 'pending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <button
                  id="accept-order-btn"
                  className="btn btn-success btn-full"
                  onClick={() => setConfirmDialog({ open: true, action: 'accept' })}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Check size={16} />
                  <span>Accept Order</span>
                </button>
                <button
                  id="reject-order-btn"
                  className="btn btn-danger btn-full"
                  onClick={() => setConfirmDialog({ open: true, action: 'reject' })}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <X size={16} />
                  <span>Reject Order</span>
                </button>
              </div>
            )}

            {order.status === 'accepted' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: 6 }}>Payment Method</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="">Select payment method…</option>
                    {PAYMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  id="complete-order-btn"
                  className="btn btn-primary btn-full"
                  onClick={() => setConfirmDialog({ open: true, action: 'complete' })}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={16} />
                  <span>Mark as Completed</span>
                </button>
              </div>
            )}

            {order.status === 'completed' && (
              <div style={{ textAlign: 'center', padding: 'var(--space-sm)', color: 'var(--success)' }}>
                <CheckCircle2 size={24} style={{ margin: '0 auto 6px' }} />
                <div style={{ fontWeight: 600 }}>Order Completed</div>
                {order.payment_method && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2, textTransform: 'capitalize' }}>
                    Paid via {order.payment_method}
                  </div>
                )}
              </div>
            )}

            {order.status === 'rejected' && (
              <div style={{ textAlign: 'center', padding: 'var(--space-sm)', color: 'var(--danger)' }}>
                <X size={24} style={{ margin: '0 auto 6px' }} />
                <div style={{ fontWeight: 600 }}>Order Cancelled</div>
              </div>
            )}

            <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border)' }}>
              <button
                className="btn btn-ghost btn-full"
                style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => setDeleteOrderDialog(true)}
                disabled={actionLoading}
              >
                <Trash2 size={15} />
                <span>Delete Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null })}
        onConfirm={() => confirmDialog.action && updateStatus(confirmDialog.action === 'accept' ? 'accepted' : confirmDialog.action === 'complete' ? 'completed' : 'rejected')}
        title={confirmDialog.action ? ACTION_LABELS[confirmDialog.action] : ''}
        message="Are you sure you want to proceed with this status update?"
        loading={actionLoading}
      />

      <ConfirmDialog
        open={deleteOrderDialog}
        onClose={() => setDeleteOrderDialog(false)}
        onConfirm={handleDeleteOrder}
        title="Delete Order Permanently"
        message={`Are you sure you want to permanently delete order ${formatOrderNumber(order.order_number)}? All items in this order will be removed.`}
        confirmLabel="Delete Order"
        loading={actionLoading}
      />
    </div>
  )
}
