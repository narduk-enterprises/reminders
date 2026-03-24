import { defineUserMutation } from '#layer/server/utils/mutation'
import { deleteCategory } from '#server/utils/reminders'
import { APP_RATE_LIMITS } from '#server/utils/rate-limits'

/**
 * DELETE /api/categories/:id
 *
 * Delete a category. Owner-only.
 */
export default defineUserMutation(
  {
    rateLimit: APP_RATE_LIMITS.categoriesWrite,
  },
  async ({ event, user }) => {
    const categoryId = getRouterParam(event, 'id')
    if (!categoryId) {
      throw createError({ statusCode: 400, message: 'Category ID is required.' })
    }

    await deleteCategory(event, categoryId, user.id)
    return { ok: true }
  },
)
