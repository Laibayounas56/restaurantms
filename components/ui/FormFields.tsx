import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// ─── Input ────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  leftIcon?: React.ReactNode
}

export function Input({ label, error, hint, required, leftIcon, className = '', ...props }: InputProps) {
  return (
    <div className="form-group">
      {label && (
        <label className={`form-label${required ? ' form-label-required' : ''}`}>
          {label}
        </label>
      )}
      <div className={leftIcon ? 'search-wrapper' : undefined}>
        {leftIcon && <span className="search-icon">{leftIcon}</span>}
        <input
          className={`form-input${leftIcon ? ' search-input' : ''} ${error ? 'border-danger' : ''} ${className}`}
          style={error ? { borderColor: 'var(--danger)' } : undefined}
          {...props}
        />
      </div>
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, hint, required, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <div className="form-group">
      {label && (
        <label className={`form-label${required ? ' form-label-required' : ''}`}>
          {label}
        </label>
      )}
      <select
        className={`form-select ${className}`}
        style={error ? { borderColor: 'var(--danger)' } : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

export function Textarea({ label, error, hint, required, className = '', ...props }: TextareaProps) {
  return (
    <div className="form-group">
      {label && (
        <label className={`form-label${required ? ' form-label-required' : ''}`}>
          {label}
        </label>
      )}
      <textarea
        className={`form-textarea ${className}`}
        style={error ? { borderColor: 'var(--danger)' } : undefined}
        {...props}
      />
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
