import React from 'react'

export interface TandooriStopLogoProps {
  /**
   * Layout variant:
   * - 'full': Emblem + bold TANDOORI STOP wordmark + optional subtitle
   * - 'compact': Inline horizontal lockup optimized for topbars & headers
   * - 'icon': Just the signature tandoor flame emblem (for avatars, favicons, collapsed sidebar)
   * - 'badge': Emblem framed in an illuminated neon-sign rounded badge
   */
  variant?: 'full' | 'compact' | 'icon' | 'badge'
  /**
   * Sizing presets or custom pixel height
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
  /**
   * Display subtitle below wordmark (default: true for 'full')
   */
  showSubtitle?: boolean
  subtitle?: string
  className?: string
  style?: React.CSSProperties
}

export function TandooriStopLogo({
  variant = 'full',
  size = 'md',
  showSubtitle = true,
  subtitle = 'AUTHENTIC GRILL & RESTAURANT OPS',
  className = '',
  style,
}: TandooriStopLogoProps) {
  // Compute pixel dimensions
  let height = 36
  if (typeof size === 'number') {
    height = size
  } else {
    switch (size) {
      case 'sm':
        height = 28
        break
      case 'md':
        height = 38
        break
      case 'lg':
        height = 50
        break
      case 'xl':
        height = 64
        break
    }
  }

  // Pure Icon / Emblem Only
  if (variant === 'icon') {
    return (
      <svg
        width={height}
        height={height}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, display: 'inline-block', ...style }}
        aria-label="Tandoori Stop"
      >
        <defs>
          <linearGradient id="tsFlameGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E6353E" />
            <stop offset="45%" stopColor="#F11868" />
            <stop offset="100%" stopColor="#FAE55D" />
          </linearGradient>
          <linearGradient id="tsBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1C1C1C" />
            <stop offset="100%" stopColor="#111111" />
          </linearGradient>
          <filter id="tsFlameGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Shield background */}
        <rect
          x="2"
          y="2"
          width="40"
          height="40"
          rx="10"
          fill="url(#tsBadgeGrad)"
          stroke="#F11868"
          strokeWidth="1.75"
        />

        {/* Tandoor Oven Base Silhouette */}
        <path
          d="M12 32C12 30 14 27 22 27C30 27 32 30 32 32C32 34 29 35 22 35C15 35 12 34 12 32Z"
          fill="#FAE55D"
          opacity="0.9"
        />

        {/* Roaring Tandoori Flame */}
        <path
          d="M22 8C22 8 26 14 26 18C26 19.5 25.4 20.8 24.5 21.8C25.8 21.3 28 20 28 17C30.5 20.5 30 25.5 26.5 28C24.5 29.5 21.5 29.8 19 28.5C16 26.8 14.5 23.5 15.5 20C16 18 17.2 16.5 17.5 15C17.8 13.5 17 12 17 12C17 12 19 13.5 19.5 15.5C20 17 21 18 21 18C21 18 21.5 15 22 13C22.2 12.2 22 8 22 8Z"
          fill="url(#tsFlameGrad)"
          filter="url(#tsFlameGlow)"
        />

        {/* Inner Golden Core */}
        <path
          d="M22 17C22 17 24 20 24 22.5C24 24 23 25.5 21.8 26C20.5 25.5 19.5 24 19.8 22.5C20 21 21.2 19.5 22 17Z"
          fill="#FAE55D"
        />
      </svg>
    )
  }

  // Badge layout (emblem in glowing badge)
  if (variant === 'badge') {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '6px 14px 6px 8px',
          background: 'linear-gradient(135deg, #1C1C1C 0%, #111111 100%)',
          border: '1.5px solid #F11868',
          borderRadius: '9999px',
          boxShadow: '0 0 16px rgba(241, 24, 104, 0.25)',
          ...style,
        }}
      >
        <TandooriStopLogo variant="icon" size={height} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: height * 0.42,
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              lineHeight: 1.1,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Tandoori <span style={{ color: '#FAE55D' }}>Stop</span>
          </span>
          {showSubtitle && (
            <span
              style={{
                fontSize: height * 0.22,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#F11868',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Compact horizontal lockup (Header, Topbar, Waiter layout)
  if (variant === 'compact') {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          userSelect: 'none',
          ...style,
        }}
      >
        <TandooriStopLogo variant="icon" size={height} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: Math.max(15, height * 0.44),
              fontWeight: 900,
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              fontFamily: 'Inter, system-ui, sans-serif',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ color: '#FFFFFF', textShadow: '0 0 8px rgba(241, 24, 104, 0.3)' }}>
              TANDOORI
            </span>
            <span
              style={{
                color: '#FAE55D',
                textShadow: '0 0 8px rgba(250, 229, 93, 0.4)',
                background: 'rgba(250, 229, 93, 0.12)',
                padding: '1px 5px',
                borderRadius: '4px',
                border: '1px solid rgba(250, 229, 93, 0.3)',
              }}
            >
              STOP
            </span>
          </div>
          {showSubtitle && (
            <span
              style={{
                fontSize: Math.max(9, height * 0.22),
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: '#9CA3AF',
                textTransform: 'uppercase',
                marginTop: 1,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Full Wordmark & Emblem Lockup (Default: Sidebar, Login, Dashboard Hero)
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        userSelect: 'none',
        ...style,
      }}
    >
      <TandooriStopLogo variant="icon" size={height} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            fontSize: Math.max(16, height * 0.46),
            fontWeight: 900,
            letterSpacing: '0.05em',
            lineHeight: 1.1,
            fontFamily: 'Inter, system-ui, sans-serif',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              letterSpacing: '0.04em',
            }}
          >
            TANDOORI
          </span>
          <span
            style={{
              color: '#FAE55D',
              background: 'linear-gradient(180deg, #FAE55D 0%, #EAB308 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 12px rgba(250, 229, 93, 0.4)',
              position: 'relative',
            }}
          >
            STOP
          </span>
        </div>
        {showSubtitle && (
          <div
            style={{
              fontSize: Math.max(9, height * 0.22),
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#F11868',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 2,
            }}
          >
            <span>{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TandooriStopLogo
