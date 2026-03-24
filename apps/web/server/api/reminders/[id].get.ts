import { requireAuth } from '#layer/server/utils/auth'
import { getReminder } from '#server/utils/reminders'

/**
 * GET /api/reminders/:id
 *
 * Get a single reminder by ID. Owner-only.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const reminderId = getRouterParam(event, 'id')

  if (!reminderId) {
    throw createError({ statusCode: 400, message: 'Reminder ID is required.' })
  }

  const reminder = await getReminder(event, reminderId, user.id)
  if (!reminder) {
    throw createError({ statusCode: 404, message: 'Reminder not found.' })
  }

  return { reminder }
})
