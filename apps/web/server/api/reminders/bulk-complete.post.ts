import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { bulkCompleteReminders } from '#server/utils/reminders'
import { bulkOperationSchema } from '#server/utils/validation'
import { APP_RATE_LIMITS } from '#server/utils/rate-limits'

/**
 * POST /api/reminders/bulk-complete
 *
 * Mark multiple reminders as completed in one request.
 */
export default defineUserMutation(
  {
    rateLimit: APP_RATE_LIMITS.remindersBulk,
    parseBody: withValidatedBody(bulkOperationSchema.parse),
  },
  async ({ event, user, body }) => {
    const count = await bulkCompleteReminders(event, user.id, body.ids)
    return { completed: count }
  },
)
