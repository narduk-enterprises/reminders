import { requireAuth } from '#layer/server/utils/auth'
import { listCategories } from '#server/utils/reminders'

/**
 * GET /api/categories
 *
 * List all categories for the authenticated user.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const items = await listCategories(event, user.id)
  return { categories: items }
})
