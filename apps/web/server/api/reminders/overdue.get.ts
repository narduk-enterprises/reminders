import { requireAuth } from '#layer/server/utils/auth'
import { getOverdueReminders } from '#server/utils/reminders'

/**
 * GET /api/reminders/overdue
 *
 * Get all overdue pending reminders for the authenticated user.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const items = await getOverdueReminders(event, user.id)
  return { reminders: items }
})
