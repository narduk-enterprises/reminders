import { eq, and } from 'drizzle-orm'

const REMINDERS_WRITE_POLICY = {
  namespace: 'reminders:write',
  maxRequests: 60,
  windowMs: 60_000,
}

export default defineUserMutation(
  { rateLimit: REMINDERS_WRITE_POLICY },
  async ({ event, user }) => {
    const db = useAppDatabase(event)
    const { reminders } = await import('#server/database/schema')
    const id = Number(getRouterParam(event, 'id'))

    const [deleted] = await db
      .delete(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, user.id)))
      .returning()

    if (!deleted) throw createError({ statusCode: 404 })
    return { ok: true }
  },
)
