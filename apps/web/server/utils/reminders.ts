import type { H3Event } from 'h3'
import { eq, and, desc, sql, like } from 'drizzle-orm'
import { reminders, categories } from '#server/database/app-schema'
import type { Reminder, Category } from '#server/database/app-schema'
import { useDatabase } from '#layer/server/utils/database'
import type { CreateReminderInput, UpdateReminderInput } from './validation'

// ─── Reminder CRUD ──────────────────────────────────────────

export async function createReminder(
  event: H3Event,
  userId: string,
  input: CreateReminderInput,
): Promise<Reminder> {
  const db = useDatabase(event)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const values = {
    id,
    userId,
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? 'medium',
    status: 'pending' as const,
    dueDate: input.dueDate ?? null,
    categoryId: input.categoryId ?? null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(reminders).values(values)
  return values as Reminder
}

export async function getReminder(
  event: H3Event,
  reminderId: string,
  userId: string,
): Promise<Reminder | undefined> {
  const db = useDatabase(event)
  return db
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .get()
}

export async function updateReminder(
  event: H3Event,
  reminderId: string,
  userId: string,
  input: UpdateReminderInput,
): Promise<Reminder> {
  const db = useDatabase(event)
  const now = new Date().toISOString()

  const updates: Record<string, unknown> = { updatedAt: now }
  if (input.title !== undefined) updates.title = input.title
  if (input.description !== undefined) updates.description = input.description
  if (input.priority !== undefined) updates.priority = input.priority
  if (input.dueDate !== undefined) updates.dueDate = input.dueDate
  if (input.categoryId !== undefined) updates.categoryId = input.categoryId
  if (input.status !== undefined) {
    updates.status = input.status
    if (input.status === 'completed') {
      updates.completedAt = now
    } else {
      updates.completedAt = null
    }
  }

  const result = await db
    .update(reminders)
    .set(updates)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .returning()

  if (!result.length) {
    throw createError({ statusCode: 404, message: 'Reminder not found.' })
  }
  return result[0]!
}

export async function deleteReminder(
  event: H3Event,
  reminderId: string,
  userId: string,
): Promise<void> {
  const db = useDatabase(event)
  const result = await db
    .delete(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .returning({ id: reminders.id })

  if (!result.length) {
    throw createError({ statusCode: 404, message: 'Reminder not found.' })
  }
}

export async function toggleReminderComplete(
  event: H3Event,
  reminderId: string,
  userId: string,
): Promise<Reminder> {
  const existing = await getReminder(event, reminderId, userId)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Reminder not found.' })
  }

  const isCompleted = existing.status === 'completed'
  return updateReminder(event, reminderId, userId, {
    status: isCompleted ? 'pending' : 'completed',
  })
}

// ─── Listing & Filtering ────────────────────────────────────

export interface ListRemindersOptions {
  page: number
  limit: number
  status?: string
  priority?: string
  categoryId?: string
  search?: string
}

export async function listReminders(
  event: H3Event,
  userId: string,
  options: ListRemindersOptions,
): Promise<{ items: Reminder[]; total: number }> {
  const db = useDatabase(event)
  const offset = (options.page - 1) * options.limit

  const conditions = [eq(reminders.userId, userId)]
  if (options.status) conditions.push(eq(reminders.status, options.status))
  if (options.priority) conditions.push(eq(reminders.priority, options.priority))
  if (options.categoryId) conditions.push(eq(reminders.categoryId, options.categoryId))
  if (options.search) conditions.push(like(reminders.title, `%${options.search}%`))

  const whereClause = and(...conditions)

  const [totalResult, items] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(reminders).where(whereClause).get(),
    db
      .select()
      .from(reminders)
      .where(whereClause)
      .orderBy(desc(reminders.createdAt))
      .limit(options.limit)
      .offset(offset)
      .all(),
  ])

  return {
    items,
    total: Number(totalResult?.count ?? 0),
  }
}

export async function getOverdueReminders(
  event: H3Event,
  userId: string,
  now?: string,
): Promise<Reminder[]> {
  const db = useDatabase(event)
  const ref = now ?? new Date().toISOString()

  return db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.status, 'pending'),
        sql`${reminders.dueDate} IS NOT NULL AND ${reminders.dueDate} < ${ref}`,
      ),
    )
    .orderBy(desc(reminders.dueDate))
    .all()
}

export async function getDueTodayReminders(
  event: H3Event,
  userId: string,
  now?: string,
): Promise<Reminder[]> {
  const db = useDatabase(event)
  const ref = now ?? new Date().toISOString()
  const today = ref.slice(0, 10)

  return db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.status, 'pending'),
        sql`${reminders.dueDate} IS NOT NULL AND substr(${reminders.dueDate}, 1, 10) = ${today}`,
      ),
    )
    .orderBy(reminders.dueDate)
    .all()
}

export async function getReminderStats(
  event: H3Event,
  userId: string,
  now?: string,
): Promise<{
  total: number
  pending: number
  completed: number
  snoozed: number
  cancelled: number
  overdue: number
  dueToday: number
  byPriority: Record<string, number>
}> {
  const db = useDatabase(event)
  const ref = now ?? new Date().toISOString()
  const today = ref.slice(0, 10)

  const statusCounts = await db
    .select({
      status: reminders.status,
      count: sql<number>`count(*)`,
    })
    .from(reminders)
    .where(eq(reminders.userId, userId))
    .groupBy(reminders.status)
    .all()

  const priorityCounts = await db
    .select({
      priority: reminders.priority,
      count: sql<number>`count(*)`,
    })
    .from(reminders)
    .where(eq(reminders.userId, userId))
    .groupBy(reminders.priority)
    .all()

  const overdueResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(reminders)
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.status, 'pending'),
        sql`${reminders.dueDate} IS NOT NULL AND ${reminders.dueDate} < ${ref}`,
      ),
    )
    .get()

  const dueTodayResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(reminders)
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.status, 'pending'),
        sql`${reminders.dueDate} IS NOT NULL AND substr(${reminders.dueDate}, 1, 10) = ${today}`,
      ),
    )
    .get()

  const statusMap: Record<string, number> = {}
  for (const row of statusCounts) {
    statusMap[row.status] = Number(row.count)
  }

  const priorityMap: Record<string, number> = {}
  for (const row of priorityCounts) {
    priorityMap[row.priority] = Number(row.count)
  }

  const total = Object.values(statusMap).reduce((a, b) => a + b, 0)

  return {
    total,
    pending: statusMap.pending ?? 0,
    completed: statusMap.completed ?? 0,
    snoozed: statusMap.snoozed ?? 0,
    cancelled: statusMap.cancelled ?? 0,
    overdue: Number(overdueResult?.count ?? 0),
    dueToday: Number(dueTodayResult?.count ?? 0),
    byPriority: priorityMap,
  }
}

export async function getUpcomingReminders(
  event: H3Event,
  userId: string,
  days: number = 7,
  now?: string,
): Promise<Reminder[]> {
  const db = useDatabase(event)
  const ref = now ?? new Date().toISOString()
  const futureDate = new Date(new Date(ref).getTime() + days * 24 * 60 * 60 * 1000).toISOString()

  return db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.status, 'pending'),
        sql`${reminders.dueDate} IS NOT NULL AND ${reminders.dueDate} >= ${ref} AND ${reminders.dueDate} <= ${futureDate}`,
      ),
    )
    .orderBy(reminders.dueDate)
    .all()
}

// ─── Bulk Operations ────────────────────────────────────────

export async function bulkCompleteReminders(
  event: H3Event,
  userId: string,
  ids: string[],
): Promise<number> {
  const db = useDatabase(event)
  const now = new Date().toISOString()
  let count = 0

  for (const id of ids) {
    const result = await db
      .update(reminders)
      .set({ status: 'completed', completedAt: now, updatedAt: now })
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId), eq(reminders.status, 'pending')))
      .returning({ id: reminders.id })
    count += result.length
  }
  return count
}

export async function bulkDeleteReminders(
  event: H3Event,
  userId: string,
  ids: string[],
): Promise<number> {
  const db = useDatabase(event)
  let count = 0

  for (const id of ids) {
    const result = await db
      .delete(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
      .returning({ id: reminders.id })
    count += result.length
  }
  return count
}

// ─── Category CRUD ──────────────────────────────────────────

export async function createCategory(
  event: H3Event,
  userId: string,
  input: { name: string; color?: string; icon?: string },
): Promise<Category> {
  const db = useDatabase(event)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const values = {
    id,
    userId,
    name: input.name,
    color: input.color ?? '#6366f1',
    icon: input.icon ?? null,
    createdAt: now,
  }

  await db.insert(categories).values(values)
  return values as Category
}

export async function listCategories(
  event: H3Event,
  userId: string,
): Promise<Category[]> {
  const db = useDatabase(event)
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.name)
    .all()
}

export async function deleteCategory(
  event: H3Event,
  categoryId: string,
  userId: string,
): Promise<void> {
  const db = useDatabase(event)
  const result = await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning({ id: categories.id })

  if (!result.length) {
    throw createError({ statusCode: 404, message: 'Category not found.' })
  }
}
