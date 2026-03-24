import { defineUserMutation } from '#layer/server/utils/mutation'
import { deleteReminder } from '#server/utils/reminders'
import { APP_RATE_LIMITS } from '#server/utils/rate-limits'

/**
 * DELETE /api/reminders/:id
 *
 * Delete a reminder. Owner-only.
 */
export default defineUserMutation(
  {
    rateLimit: APP_RATE_LIMITS.remindersWrite,
  },
  async ({ event, user }) => {
    const reminderId = getRouterParam(event, 'id')
    if (!reminderId) {
      throw createError({ statusCode: 400, message: 'Reminder ID is required.' })
    }

    await deleteReminder(event, reminderId, user.id)
    return { ok: true }
  },
)
