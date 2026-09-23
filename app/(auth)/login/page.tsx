'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
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
  Flame,
  ChefHat,
  BarChart3,
  Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { TandooriStopLogo } from '@/components/ui/TandooriStopLogo'
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
      document.cookie = `test_auth_role=${matchedTest.role}; path=/; max-age=604800; SameSite=Lax`
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
      showError('Invalid email or password. For quick testing, use the test credentials below.')
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
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        background: 'var(--bg)',
        position: 'relative',
      }}
      className="login-split-container"
    >
      {/* Top right Theme Toggle */}
      <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 30 }}>
        <ThemeToggle showLabel />
      </div>

      {/* ─── LEFT SHOWCASE HERO ─────────────────────────────────── */}
      <div
        className="login-hero-panel"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 48px',
          overflow: 'hidden',
          background: '#0D0D0D',
          color: '#FFFFFF',
        }}
      >
        {/* Background Image with atmospheric warm glow overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        >
          <img
            src="/images/food/hero-tandoor.jpg"
            alt="Tandoori Stop Kitchen"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'brightness(0.55) contrast(1.1)',
            }}
          />
          {/* Dual Gradient Overlays */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(17,17,17,0.85) 0%, rgba(241,24,104,0.3) 50%, rgba(17,17,17,0.92) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at bottom left, rgba(250,229,93,0.18) 0%, transparent 60%)',
            }}
          />
        </div>

        {/* Top Branding */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <TandooriStopLogo variant="badge" size="md" />
        </div>

        {/* Hero Central Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 520, margin: 'auto 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(250, 229, 93, 0.14)',
              border: '1px solid rgba(250, 229, 93, 0.3)',
              color: '#FAE55D',
              fontSize: '0.8125rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              marginBottom: 20,
              textTransform: 'uppercase',
            }}
          >
            <Flame size={15} style={{ color: '#F11868' }} />
            <span>The Art of Charcoal & Clay</span>
          </div>

          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              marginBottom: 16,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            Mastering Tandoor Operations with{' '}
            <span
              style={{
                color: '#FAE55D',
                background: 'linear-gradient(90deg, #FAE55D 0%, #FF6B9D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Precision & Speed
            </span>
          </h1>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#E5E7EB',
              marginBottom: 32,
              fontWeight: 400,
            }}
          >
            A tailored digital command center built exclusively for Tandoori Stop. Effortlessly track live kitchen orders, control recipe inventory, schedule staff, and monitor real-time dining floor revenues.
          </p>

          {/* Value Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <ChefHat size={18} style={{ color: '#FAE55D', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Live Kitchen POS & Tables</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <BarChart3 size={18} style={{ color: '#F11868', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Real-Time Financial Reports</span>
            </div>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            paddingTop: 20,
            fontSize: '0.8125rem',
            color: '#9CA3AF',
          }}
        >
          <span>Tandoori Stop Restaurant Management System</span>
          <span style={{ color: '#FAE55D', fontWeight: 600 }}>Authentic Indian & Pakistani Grill</span>
        </div>
      </div>

      {/* ─── RIGHT LOGIN FORM CARD ──────────────────────────────── */}
      <div
        className="login-form-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Header */}
          <div style={{ marginBottom: 'var(--space-lg)', textAlign: 'left' }}>
            <div style={{ marginBottom: 14 }}>
              <TandooriStopLogo variant="full" size="md" />
            </div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Sign In to Your Portal
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
              Enter your credentials to access the management workspace
            </p>
          </div>

          {/* Form Card */}
          <div
            className="card"
            style={{
              padding: 'var(--space-xl)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)',
            }}
          >
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
                    placeholder="admin@restaurant.com"
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
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
                  <Sparkles size={15} style={{ color: 'var(--brand-red)' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Test Accounts (One-Click Demo)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-red)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Code2 size={13} />
                  <span>Seed SQL</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {TEST_ACCOUNTS.map((account) => {
                  const isAdmin = account.role === 'admin'
                  return (
                    <div
                      key={account.id}
                      style={{
                        background: 'var(--surface-hover)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        transition: 'border-color var(--transition-fast)',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: isAdmin ? 'rgba(241, 24, 104, 0.16)' : 'rgba(56, 189, 248, 0.16)',
                              color: isAdmin ? 'var(--brand-red)' : '#38BDF8',
                              border: `1px solid ${isAdmin ? 'rgba(241, 24, 104, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                            }}
                          >
                            {account.label}
                          </span>
                          <code style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                            {account.email}
                          </code>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Password: <code style={{ color: 'var(--brand-red)', fontWeight: 600 }}>{account.password}</code>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleFillTestAccount(account, false)}
                          disabled={isPending}
                          className="btn btn-secondary btn-sm"
                          title="Fill credentials into input fields"
                          style={{ fontSize: '0.75rem', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <KeyRound size={12} />
                          <span>Fill</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFillTestAccount(account, true)}
                          disabled={isPending}
                          className="btn btn-sm"
                          title="Fill and sign in immediately"
                          style={{
                            fontSize: '0.75rem',
                            padding: '5px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            background: isAdmin ? 'var(--brand-red)' : '#0284C7',
                            color: '#FFFFFF',
                            border: 'none',
                            fontWeight: 700,
                          }}
                        >
                          <Zap size={12} />
                          <span>Login</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
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
            Tandoori Stop © {new Date().getFullYear()} — Restaurant Management System
          </p>
        </div>
      </div>

      {/* SQL Seed Modal */}
      {showSqlModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
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
                <Code2 size={20} style={{ color: 'var(--brand-red)' }} />
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
        @media (max-width: 900px) {
          .login-split-container {
            grid-template-columns: 1fr !important;
          }
          .login-hero-panel {
            display: none !important;
          }
          .login-form-panel {
            padding: 32px 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
