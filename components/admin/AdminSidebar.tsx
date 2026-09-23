'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  UtensilsCrossed,
  Boxes,
  Users,
  CreditCard,
  BarChart3,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { TandooriStopLogo } from '@/components/ui/TandooriStopLogo'
import type { Profile } from '@/types/database'

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/admin',              icon: LayoutDashboard },
  { label: 'Orders',     href: '/admin/orders',        icon: Receipt,         section: 'Operations' },
  { label: 'Menu & Food', href: '/admin/products',     icon: UtensilsCrossed },
  { label: 'Inventory',  href: '/admin/inventory',     icon: Boxes },
  { label: 'Staff',      href: '/admin/employees',     icon: Users,           section: 'Management' },
  { label: 'Expenses',   href: '/admin/expenses',      icon: CreditCard },
  { label: 'Analytics',  href: '/admin/reports/sales', icon: BarChart3 },
]

interface AdminSidebarProps {
  profile: Profile
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)

  // Auto-close mobile drawer when navigating to a new route
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Fetch count of pending orders for live badge
  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const { count, error } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
        if (!error && count !== null) {
          setPendingOrdersCount(count)
        }
      } catch {
        // Fallback
      }
    }
    fetchPendingCount()

    // Realtime listener for order count updates
    const channel = supabase
      .channel('sidebar-orders-counter')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchPendingCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleSignOut = async () => {
    document.cookie = 'test_auth_role=; path=/; max-age=0'
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore if Supabase fails
    }
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  let currentSection = ''

  return (
    <>
      {/* Sticky Mobile Top Header with Hamburger */}
      <header className="admin-mobile-header" style={{ background: '#111111', borderBottom: '1px solid #222222' }}>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            style={{ background: '#1C1C1C', borderColor: '#2B2B2B', color: '#FFFFFF' }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <TandooriStopLogo variant="compact" size="sm" showSubtitle={false} />
        </div>

        <div className="flex items-center gap-sm">
          <ThemeToggle />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(241, 24, 104, 0.2)',
              border: '1px solid rgba(241, 24, 104, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-yellow)',
              fontWeight: 800,
              fontSize: '0.8125rem',
            }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`admin-sidebar${mobileOpen ? ' open' : ''}`}>
        {/* Brand Header */}
        <div
          className="sidebar-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 18px',
            borderBottom: '1px solid #222222',
            background: 'linear-gradient(180deg, #161616 0%, #111111 100%)',
          }}
        >
          <Link href="/admin" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
            <TandooriStopLogo variant="full" size="md" subtitle="OPERATIONS DASHBOARD" />
          </Link>

          <button
            type="button"
            className="mobile-sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            style={{ color: '#9CA3AF' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Restaurant Status Pill */}
        <div style={{ padding: '14px 18px 6px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: '#181818',
              border: '1px solid #282828',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="live-dot" style={{ width: 7, height: 7 }} />
              <span style={{ color: '#E5E7EB', fontWeight: 600 }}>Tandoor Active</span>
            </div>
            <span style={{ color: 'var(--brand-yellow)', fontWeight: 700, fontSize: '0.6875rem' }}>
              ONLINE
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="sidebar-nav" style={{ padding: '8px 12px', flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const showSection = item.section && item.section !== currentSection
            if (item.section) currentSection = item.section
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <div key={item.href}>
                {showSection && (
                  <div
                    className="sidebar-section-label"
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#6B7280',
                      padding: '14px 14px 6px',
                    }}
                  >
                    {item.section}
                  </div>
                )}
                <Link
                  href={item.href}
                  className={`nav-item ${active ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon
                    size={18}
                    style={{
                      color: active ? 'var(--brand-yellow)' : '#9CA3AF',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{item.label}</span>

                  {/* Orders Live Counter Pill */}
                  {item.href === '/admin/orders' && pendingOrdersCount > 0 && (
                    <span
                      style={{
                        padding: '1px 7px',
                        borderRadius: '9999px',
                        background: 'var(--brand-yellow)',
                        color: '#111111',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        boxShadow: '0 0 8px rgba(250, 229, 93, 0.4)',
                      }}
                    >
                      {pendingOrdersCount}
                    </span>
                  )}
                </Link>
              </div>
            )
          })}
        </nav>

        {/* User Footer & Theme Toggle */}
        <div
          style={{
            marginTop: 'auto',
            padding: '14px 16px',
            borderTop: '1px solid #222222',
            background: '#151515',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--brand-red) 0%, var(--brand-red-dark) 100%)',
                  border: '1.5px solid rgba(250, 229, 93, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  boxShadow: '0 0 10px rgba(241, 24, 104, 0.35)',
                  flexShrink: 0,
                }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: '#F9FAFB',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {profile.name}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--brand-yellow)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={11} />
                  <span>Restaurant Admin</span>
                </div>
              </div>
            </div>

            <ThemeToggle />
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: '0.8125rem',
              color: '#9CA3AF',
              background: '#1C1C1C',
              borderColor: '#2B2B2B',
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
