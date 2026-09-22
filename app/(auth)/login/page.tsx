'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  UtensilsCrossed,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  KeyRound,
  Code2,
  Copy,
  Check,
  X,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { TEST_ACCOUNTS, SEED_USERS_SQL, type TestAccount } from '@/lib/auth/test-users'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { error: showError, success: showSuccess, info: showInfo } = useToast()
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSqlModal, setShowSqlModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email) e.email = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const performLogin = async (emailToUse: string, passwordToUse: string) => {
    const email = emailToUse.trim().toLowerCase()
    const password = passwordToUse

    // ── Check Hardcoded Test Accounts First ───────────────────────
    const matchedTest = TEST_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email && a.password === password
    )

    if (matchedTest) {
      // Set test session cookie (guarantees immediate instant login!)
      document.cookie = `test_auth_role=${matchedTest.role}; path=/; max-age=604800; SameSite=Lax`

      // Also attempt Supabase signIn in background to sync auth if available
      supabase.auth.signInWithPassword({ email, password }).catch(() => {})

      showSuccess(`Authenticated as ${matchedTest.label}! (Hardcoded Test Account)`)
      if (matchedTest.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/waiter')
      }
      router.refresh()
      return
    }

    // ── Regular Supabase Auth for Other Accounts ──────────────────
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      showError('Invalid email or password. For testing, use the hardcoded test credentials below.')
      return
    }

    if (!data.user) return

    // Fetch role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      const testMatch = TEST_ACCOUNTS.find((a) => a.email.toLowerCase() === email)
      const role = testMatch?.role ?? 'waiter'

      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: testMatch?.name ?? 'User',
        username: testMatch?.username ?? email.split('@')[0],
        role,
        is_active: true,
      })

      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/waiter')
      }
      router.refresh()
      return
    }

    if (!profile.is_active) {
      await supabase.auth.signOut()
      showError('Your account has been deactivated. Contact the administrator.')
      return
    }

    if (profile.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/waiter')
    }
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      await performLogin(form.email, form.password)
    })
  }

  const handleFillTestAccount = (account: TestAccount, autoLogin = false) => {
    setForm({ email: account.email, password: account.password })
    setErrors({})
    showInfo(`Filled credentials for ${account.label}`)

    if (autoLogin) {
      startTransition(async () => {
        await performLogin(account.email, account.password)
      })
    }
  }

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SEED_USERS_SQL)
      setCopied(true)
      showSuccess('Seed SQL copied to clipboard!')
      setTimeout(() => setCopied(false), 3000)
    } catch {
      showError('Could not copy to clipboard. Please copy manually.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
        position: 'relative',
      }}
    >
      {/* Top right Theme Toggle */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <ThemeToggle showLabel />
      </div>

      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, var(--primary-glow) 0%, transparent 70%)',
        }}
      />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-sm)',
              boxShadow: 'var(--shadow-glow)',
              color: '#ffffff',
            }}
          >
            <UtensilsCrossed size={28} />
          </div>
          <h1
            style={{
              fontSize: '1.625rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            RestaurantMS
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
            Modern digital restaurant management
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 'var(--space-xl)', boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="name@restaurant.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                  disabled={isPending}
                  style={{
                    paddingLeft: 38,
                    ...(errors.email ? { borderColor: 'var(--danger)' } : {}),
                  }}
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className="form-label form-label-required" htmlFor="password" style={{ margin: 0 }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  disabled={isPending}
                  style={{
                    paddingLeft: 38,
                    paddingRight: 38,
                    ...(errors.password ? { borderColor: 'var(--danger)' } : {}),
                  }}
                />
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={isPending}
              style={{ marginTop: 'var(--space-xs)' }}
            >
              {isPending ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                  Signing in…
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* ─── Hardcoded Test Accounts Section ──────────────────────── */}
          <div
            style={{
              marginTop: 'var(--space-lg)',
              paddingTop: 'var(--space-md)',
              borderTop: '1px solid var(--border)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={15} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Test Credentials (Hardcoded)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-light)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  textDecoration: 'underline',
                }}
              >
                <Code2 size={13} />
                <span>Seed SQL</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {TEST_ACCOUNTS.map((account) => (
                <div
                  key={account.id}
                  style={{
                    background: 'var(--surface-hover)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-sm) var(--space-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: `${account.badgeColor}22`,
                          color: account.badgeColor,
                        }}
                      >
                        {account.label}
                      </span>
                      <code style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {account.email}
                      </code>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Password: <code style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{account.password}</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleFillTestAccount(account, false)}
                      disabled={isPending}
                      className="btn btn-secondary btn-sm"
                      title="Fill credentials into input fields"
                      style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <KeyRound size={12} />
                      <span>Fill</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillTestAccount(account, true)}
                      disabled={isPending}
                      className="btn btn-primary btn-sm"
                      title="Fill and sign in immediately"
                      style={{
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: account.role === 'admin' ? undefined : 'hsl(215, 88%, 48%)',
                      }}
                    >
                      <Zap size={12} />
                      <span>Login</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.4 }}>
              Click <strong>Fill</strong> to populate fields or <strong>Login</strong> to authenticate instantly.
            </p>
          </div>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-lg)',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
          }}
        >
          Restaurant Management System — SPM Project
        </p>
      </div>

      {/* SQL Seed Modal */}
      {showSqlModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-md)',
            zIndex: 9999,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 580,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 'var(--space-lg)',
              boxShadow: 'var(--shadow-xl)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code2 size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Supabase Seed & Permissions SQL
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Run this in your <strong>Supabase Dashboard → SQL Editor</strong> to seed test accounts and grant database permissions:
            </p>

            <div
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm)',
                overflowY: 'auto',
                maxHeight: 280,
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{SEED_USERS_SQL}</pre>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-sm)',
                marginTop: 'var(--space-md)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSqlModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCopySql}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
