'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function WaiterSignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    // Clear hardcoded test session cookie
    document.cookie = 'test_auth_role=; path=/; max-age=0'
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore if Supabase fails
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="btn btn-secondary btn-sm"
      style={{
        padding: '4px 10px',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}
      title="Sign Out"
    >
      Sign Out
    </button>
  )
}
