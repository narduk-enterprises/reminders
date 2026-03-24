import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { createReminder } from '#server/utils/reminders'
import { createReminderSchema } from '#server/utils/validation'
import { APP_RATE_LIMITS } from '#server/utils/rate-limits'

/**
 * POST /api/reminders
 *
 * Create a new reminder for the authenticated user.
 */
export default defineUserMutation(
  {
    rateLimit: APP_RATE_LIMITS.remindersWrite,
    parseBody: withValidatedBody(createReminderSchema.parse),
  },
  async ({ event, user, body }) => {
    const reminder = await createReminder(event, user.id, body)
    return { reminder }
  },
)
