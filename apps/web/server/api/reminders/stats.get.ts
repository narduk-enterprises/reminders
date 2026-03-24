import { requireAuth } from '#layer/server/utils/auth'
import { getReminderStats } from '#server/utils/reminders'

/**
 * GET /api/reminders/stats
 *
 * Get reminder statistics for the authenticated user.
 * Returns counts by status, priority, overdue, and due-today.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const stats = await getReminderStats(event, user.id)
  return { stats }
})
