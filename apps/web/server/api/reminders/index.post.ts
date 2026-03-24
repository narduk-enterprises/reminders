import { createReminderSchema } from '#server/utils/reminder-schemas'
import { REMINDERS_WRITE_POLICY } from '#server/utils/rate-limits'

export default defineUserMutation(
  {
    rateLimit: REMINDERS_WRITE_POLICY,
    parseBody: withValidatedBody(createReminderSchema.parse),
  },
  async ({ event, user, body }) => {
    const db = useAppDatabase(event)
    const { reminders } = await import('#server/database/schema')
    const now = new Date().toISOString()

    const [reminder] = await db
      .insert(reminders)
      .values({
        userId: user.id,
        ...body,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return reminder
  },
)
