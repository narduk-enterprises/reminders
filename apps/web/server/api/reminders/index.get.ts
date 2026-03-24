import { requireAuth } from '#layer/server/utils/auth'
import { listReminders } from '#server/utils/reminders'
import { listRemindersQuerySchema } from '#server/utils/validation'

/**
 * GET /api/reminders
 *
 * List reminders for the authenticated user with pagination and filtering.
 * Query params: ?page=1&limit=20&status=pending&priority=high&categoryId=...&search=...
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const query = await getValidatedQuery(event, (value) => listRemindersQuerySchema.safeParse(value))
  if (!query.success) {
    throw createError({ statusCode: 400, message: 'Invalid query parameters.' })
  }

  const { page, limit, status, priority, categoryId, search } = query.data
  const result = await listReminders(event, user.id, {
    page,
    limit,
    status,
    priority,
    categoryId,
    search,
  })

  return {
    reminders: result.items,
    total: result.total,
    page,
    limit,
  }
})
