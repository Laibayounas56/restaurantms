'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  showLabel?: boolean
  className?: string
}

export function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (stored) {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial = prefersDark ? 'dark' : 'light'
      setTheme(initial)
      document.documentElement.setAttribute('data-theme', initial)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className={`btn btn-secondary btn-sm ${className}`}
        aria-label="Toggle theme"
        style={{
          width: showLabel ? 'auto' : 36,
          height: 36,
          padding: showLabel ? '0 12px' : 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          borderRadius: 'var(--radius-md)',
        }}
      >
        <Moon size={16} />
        {showLabel && <span>Theme</span>}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn-secondary btn-sm ${className}`}
      title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      style={{
        width: showLabel ? 'auto' : 36,
        height: 36,
        padding: showLabel ? '0 12px' : 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
    >
      {theme === 'dark' ? (
        <>
          <Sun size={16} style={{ color: 'var(--warning)' }} />
          {showLabel && <span style={{ fontSize: '0.8125rem' }}>Light Mode</span>}
        </>
      ) : (
        <>
          <Moon size={16} style={{ color: 'var(--primary)' }} />
          {showLabel && <span style={{ fontSize: '0.8125rem' }}>Dark Mode</span>}
        </>
      )}
    </button>
  )
}
