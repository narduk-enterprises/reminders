import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { createCategory } from '#server/utils/reminders'
import { createCategorySchema } from '#server/utils/validation'
import { APP_RATE_LIMITS } from '#server/utils/rate-limits'

/**
 * POST /api/categories
 *
 * Create a new category for the authenticated user.
 */
export default defineUserMutation(
  {
    rateLimit: APP_RATE_LIMITS.categoriesWrite,
    parseBody: withValidatedBody(createCategorySchema.parse),
  },
  async ({ event, user, body }) => {
    const category = await createCategory(event, user.id, body)
    return { category }
  },
)
