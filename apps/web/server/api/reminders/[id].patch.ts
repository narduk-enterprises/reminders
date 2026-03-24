import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { updateReminder } from '#server/utils/reminders'
import { updateReminderSchema } from '#server/utils/validation'
import { APP_RATE_LIMITS } from '#server/utils/rate-limits'

/**
 * PATCH /api/reminders/:id
 *
 * Update a reminder. Owner-only.
 */
export default defineUserMutation(
  {
    rateLimit: APP_RATE_LIMITS.remindersWrite,
    parseBody: withValidatedBody(updateReminderSchema.parse),
  },
  async ({ event, user, body }) => {
    const reminderId = getRouterParam(event, 'id')
    if (!reminderId) {
      throw createError({ statusCode: 400, message: 'Reminder ID is required.' })
    }

    const reminder = await updateReminder(event, reminderId, user.id, body)
    return { reminder }
  },
)
