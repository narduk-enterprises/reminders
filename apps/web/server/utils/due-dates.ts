/**
 * Due date formatting and comparison utilities.
 *
 * Pure functions suitable for both server and client use.
 * Uses no Node.js built-ins — safe for Cloudflare Workers.
 */

/** Returns the start of a day (00:00:00.000Z) for a given date string. */
export function startOfDay(isoDate: string): string {
  return isoDate.slice(0, 10) + 'T00:00:00.000Z'
}

/** Returns the end of a day (23:59:59.999Z) for a given date string. */
export function endOfDay(isoDate: string): string {
  return isoDate.slice(0, 10) + 'T23:59:59.999Z'
}

/** Checks if a due date is before the given reference time (defaults to now). */
export function isOverdue(dueDate: string, now?: string): boolean {
  const ref = now ?? new Date().toISOString()
  return dueDate < ref
}

/** Checks if a due date falls on the same calendar day as the reference. */
export function isDueToday(dueDate: string, now?: string): boolean {
  const ref = now ?? new Date().toISOString()
  return dueDate.slice(0, 10) === ref.slice(0, 10)
}

/** Checks if a due date is within the next N days from the reference. */
export function isDueWithinDays(dueDate: string, days: number, now?: string): boolean {
  const ref = now ?? new Date().toISOString()
  const refMs = new Date(ref).getTime()
  const dueMs = new Date(dueDate).getTime()
  const diffMs = dueMs - refMs
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000
}

/**
 * Returns a human-readable relative time label for a due date.
 *
 * Examples: "Overdue", "Due today", "Due tomorrow", "Due in 3 days", "Due Mar 28"
 */
export function formatDueDate(dueDate: string, now?: string): string {
  const ref = now ?? new Date().toISOString()
  const refDate = new Date(ref)
  const due = new Date(dueDate)

  const refDay = refDate.toISOString().slice(0, 10)
  const dueDay = due.toISOString().slice(0, 10)

  if (dueDay < refDay) return 'Overdue'
  if (dueDay === refDay) return 'Due today'

  const diffMs = due.getTime() - refDate.getTime()
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000))

  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `Due in ${diffDays} days`

  const month = due.toLocaleString('en-US', { month: 'short' })
  const day = due.getDate()
  return `Due ${month} ${day}`
}

/**
 * Sorts reminders by priority weight (urgent first) then by due date (earliest first).
 */
export function sortByUrgency<T extends { priority: string; dueDate?: string | null }>(
  items: T[],
): T[] {
  const WEIGHTS: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 }
  return [...items].sort((a, b) => {
    const wa = WEIGHTS[a.priority] ?? 0
    const wb = WEIGHTS[b.priority] ?? 0
    if (wb !== wa) return wb - wa
    // Then sort by due date (null/undefined dates go last)
    const da = a.dueDate ?? 'z'
    const db = b.dueDate ?? 'z'
    return da.localeCompare(db)
  })
}
