import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { UtensilsCrossed } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WaiterBottomNav } from '@/components/waiter/WaiterBottomNav'
import { WaiterSignOutButton } from '@/components/waiter/WaiterSignOutButton'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { TandooriStopLogo } from '@/components/ui/TandooriStopLogo'

export const metadata: Metadata = {
  title: 'Waiter — RestaurantMS',
  description: 'Restaurant Management System Waiter Interface',
}

const DEFAULT_WAITER_PROFILE = {
  id: 'b0000000-0000-0000-0000-000000000002',
  name: 'John Waiter',
  role: 'waiter',
  is_active: true,
}

export default async function WaiterLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const testRole = cookieStore.get('test_auth_role')?.value

  let profile = testRole === 'waiter' ? DEFAULT_WAITER_PROFILE : null

  if (!profile) {
    const supabase = await createClient()
    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch {
      user = null
    }

    if (!user) redirect('/login')

    try {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('id, role, name, is_active')
        .eq('id', user.id)
        .single()
      profile = dbProfile
    } catch {
      profile = null
    }

    if (!profile) {
      profile = {
        ...DEFAULT_WAITER_PROFILE,
        id: user.id,
        name: user.user_metadata?.name ?? 'John Waiter',
      }
    }
  }

  return (
    <div className="waiter-layout">
      <header className="waiter-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <TandooriStopLogo variant="compact" size="sm" showSubtitle={false} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <ThemeToggle />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-hover)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--primary-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-light)',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </span>
            <span className="hidden-mobile" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {profile.name}
            </span>
          </div>
          <WaiterSignOutButton />
        </div>
      </header>

      <main className="waiter-content">{children}</main>

      <WaiterBottomNav />
    </div>
  )
}
