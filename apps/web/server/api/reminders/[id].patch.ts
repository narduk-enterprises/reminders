import { eq, and } from 'drizzle-orm'
import { updateReminderSchema } from '#server/utils/reminder-schemas'

const REMINDERS_WRITE_POLICY = {
  namespace: 'reminders:write',
  maxRequests: 60,
  windowMs: 60_000,
}

export default defineUserMutation(
  {
    rateLimit: REMINDERS_WRITE_POLICY,
    parseBody: withValidatedBody(updateReminderSchema.parse),
  },
  async ({ event, user, body }) => {
    const db = useAppDatabase(event)
    const { reminders } = await import('#server/database/schema')
    const id = Number(getRouterParam(event, 'id'))

    const [updated] = await db
      .update(reminders)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(and(eq(reminders.id, id), eq(reminders.userId, user.id)))
      .returning()

    if (!updated) throw createError({ statusCode: 404 })
    return updated
  },
)
