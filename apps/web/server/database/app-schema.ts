import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from '#layer/server/database/schema'

// ─── Categories ─────────────────────────────────────────────
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6366f1'), // Hex color
  icon: text('icon'), // Optional lucide icon name
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

// ─── Reminders ──────────────────────────────────────────────
export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('medium'), // 'low' | 'medium' | 'high' | 'urgent'
  status: text('status').notNull().default('pending'), // 'pending' | 'completed' | 'snoozed' | 'cancelled'
  dueDate: text('due_date'), // ISO 8601 datetime string
  completedAt: text('completed_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

// ─── Type helpers ───────────────────────────────────────────
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Reminder = typeof reminders.$inferSelect
export type NewReminder = typeof reminders.$inferInsert
