import Link from 'next/link'
import { PlusCircle, ClipboardList, ArrowRight } from 'lucide-react'

export default function WaiterHome() {
  return (
    <div style={{ padding: 'var(--space-md)', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Welcome back
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.875rem' }}>
          Select an action below to start managing tables and orders.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <Link
          href="/waiter/new-order"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
            textDecoration: 'none',
            color: '#fff',
            boxShadow: 'var(--shadow-glow)',
            transition: 'transform var(--transition-fast)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlusCircle size={26} />
            </div>
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>New Order</div>
              <div style={{ opacity: 0.9, marginTop: 2, fontSize: '0.8125rem' }}>
                Select a table and take customer order
              </div>
            </div>
          </div>
          <ArrowRight size={20} />
        </Link>

        <Link
          href="/waiter/my-orders"
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-lg)',
            textDecoration: 'none',
            transition: 'border-color var(--transition-fast), background var(--transition-fast)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <ClipboardList size={26} />
            </div>
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Orders</div>
              <div style={{ color: 'var(--text-muted)', marginTop: 2, fontSize: '0.8125rem' }}>
                View and track your active table orders
              </div>
            </div>
          </div>
          <ArrowRight size={20} style={{ color: 'var(--text-muted)' }} />
        </Link>
      </div>
    </div>
  )
}
