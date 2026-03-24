import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useAppDatabase(event)
  const { reminders } = await import('#server/database/schema')

  return db
    .select()
    .from(reminders)
    .where(eq(reminders.userId, session.user.id))
    .orderBy(asc(reminders.createdAt))
})
