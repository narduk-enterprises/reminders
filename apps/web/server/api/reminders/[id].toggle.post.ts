import { defineUserMutation } from '#layer/server/utils/mutation'
import { toggleReminderComplete } from '#server/utils/reminders'
import { APP_RATE_LIMITS } from '#server/utils/rate-limits'

/**
 * POST /api/reminders/:id/toggle
 *
 * Toggle a reminder between pending and completed. Owner-only.
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

    const reminder = await toggleReminderComplete(event, reminderId, user.id)
    return { reminder }
  },
)
