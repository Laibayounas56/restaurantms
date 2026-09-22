/**
 * Format a number as Pakistani Rupees
 */
export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format a datetime string for display
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format time only (HH:MM AM/PM)
 */
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get date range boundaries
 */
export type DateRangePreset = 'today' | 'week' | 'month' | 'custom'

export function getDateRange(preset: DateRangePreset, customStart?: string, customEnd?: string) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  switch (preset) {
    case 'today':
      return { start: today, end: today }
    case 'week': {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 6)
      return { start: weekAgo.toISOString().split('T')[0], end: today }
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: monthStart.toISOString().split('T')[0], end: today }
    }
    case 'custom':
      return { start: customStart ?? today, end: customEnd ?? today }
    default:
      return { start: today, end: today }
  }
}

/**
 * Generate a human-readable order number label
 */
export function formatOrderNumber(orderNumber: number): string {
  return `#${String(orderNumber).padStart(4, '0')}`
}

/**
 * Status badge color mapping
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':   return 'badge-warning'
    case 'accepted':  return 'badge-info'
    case 'completed': return 'badge-success'
    case 'rejected':  return 'badge-danger'
    case 'paid':      return 'badge-success'
    case 'scheduled': return 'badge-info'
    case 'missed':    return 'badge-danger'
    default:          return 'badge-default'
  }
}

/**
 * Status label for display
 */
export function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
