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
  Utensils,
  Menu,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { Profile } from '@/types/database'

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/admin',              icon: LayoutDashboard },
  { label: 'Orders',     href: '/admin/orders',        icon: Receipt,         section: 'Operations' },
  { label: 'Products',   href: '/admin/products',      icon: UtensilsCrossed },
  { label: 'Inventory',  href: '/admin/inventory',     icon: Boxes },
  { label: 'Employees',  href: '/admin/employees',     icon: Users,           section: 'Management' },
  { label: 'Expenses',   href: '/admin/expenses',      icon: CreditCard },
  { label: 'Reports',    href: '/admin/reports/sales', icon: BarChart3 },
]

interface AdminSidebarProps {
  profile: Profile
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

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
      <header className="admin-mobile-header">
        <div className="flex items-center gap-sm">
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-xs">
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Utensils size={15} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              RestaurantMS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-sm">
          <ThemeToggle />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-light)',
              fontWeight: 700,
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
        <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div
              className="sidebar-brand-icon"
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Utensils size={20} />
            </div>
            <div>
              <div className="sidebar-brand-name" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                RestaurantMS
              </div>
              <div className="sidebar-brand-sub" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Admin Portal
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mobile-sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="sidebar-nav" style={{ padding: 'var(--space-sm) var(--space-xs)' }}>
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
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted)',
                      padding: '12px 12px 4px',
                    }}
                  >
                    {item.section}
                  </div>
                )}
                <Link
                  href={item.href}
                  className={`nav-item ${active ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--primary-light)' : 'var(--text-secondary)',
                    background: active ? 'var(--primary-muted)' : 'transparent',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      color: active ? 'var(--primary-light)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  />
                  <span>{item.label}</span>
                </Link>
              </div>
            )
          })}
        </nav>

        {/* User Footer & Theme Toggle */}
        <div
          style={{
            marginTop: 'auto',
            padding: 'var(--space-md)',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-light)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  flexShrink: 0,
                }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {profile.name}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Admin
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
              color: 'var(--text-muted)',
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
