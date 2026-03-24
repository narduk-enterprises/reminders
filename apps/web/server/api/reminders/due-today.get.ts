import { requireAuth } from '#layer/server/utils/auth'
import { getDueTodayReminders } from '#server/utils/reminders'

/**
 * GET /api/reminders/due-today
 *
 * Get all reminders due today for the authenticated user.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const items = await getDueTodayReminders(event, user.id)
  return { reminders: items }
})
