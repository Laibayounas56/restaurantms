'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, ClipboardList } from 'lucide-react'

const ITEMS = [
  { label: 'Home',       href: '/waiter',           icon: Home },
  { label: 'New Order',  href: '/waiter/new-order',  icon: PlusCircle },
  { label: 'My Orders',  href: '/waiter/my-orders',  icon: ClipboardList },
]

export function WaiterBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav" aria-label="Waiter navigation">
      {ITEMS.map((item) => {
        const Icon = item.icon
        const active =
          item.href === '/waiter'
            ? pathname === '/waiter'
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item${active ? ' active' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              color: active ? 'var(--primary-light)' : 'var(--text-muted)',
              transition: 'color var(--transition-fast)',
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: '0.75rem', fontWeight: active ? 600 : 500 }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
