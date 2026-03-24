/**
 * App-owned database schema.
 *
 * drizzle-kit generates apps/web/drizzle/*.sql from this file only, so shared
 * layer tables are not duplicated into the app's migration directory.
 */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from '#layer/server/database/schema'

export const reminders = sqliteTable('reminders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueAt: text('due_at'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] })
    .notNull()
    .default('medium'),
  category: text('category'),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})
