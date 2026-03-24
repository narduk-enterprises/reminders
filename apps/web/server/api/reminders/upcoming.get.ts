import { z } from 'zod'
import { requireAuth } from '#layer/server/utils/auth'
import { getUpcomingReminders } from '#server/utils/reminders'

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
})

/**
 * GET /api/reminders/upcoming
 *
 * Get upcoming reminders within the next N days (default 7).
 * Query params: ?days=7
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const query = await getValidatedQuery(event, (value) => querySchema.safeParse(value))
  if (!query.success) {
    throw createError({ statusCode: 400, message: 'Invalid query parameters.' })
  }

  const items = await getUpcomingReminders(event, user.id, query.data.days)
  return { reminders: items }
})
