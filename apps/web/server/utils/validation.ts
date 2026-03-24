import { z } from 'zod'

// ─── Enums ──────────────────────────────────────────────────

export const REMINDER_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type ReminderPriority = (typeof REMINDER_PRIORITIES)[number]

export const REMINDER_STATUSES = ['pending', 'completed', 'snoozed', 'cancelled'] as const
export type ReminderStatus = (typeof REMINDER_STATUSES)[number]

export const PRIORITY_WEIGHTS: Record<ReminderPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
}

export const PRIORITY_COLORS: Record<ReminderPriority, string> = {
  low: '#94a3b8',
  medium: '#6366f1',
  high: '#f59e0b',
  urgent: '#ef4444',
}

export const PRIORITY_ICONS: Record<ReminderPriority, string> = {
  low: 'i-lucide-arrow-down',
  medium: 'i-lucide-minus',
  high: 'i-lucide-arrow-up',
  urgent: 'i-lucide-alert-triangle',
}

// ─── Zod Schemas ────────────────────────────────────────────

export const reminderPrioritySchema = z.enum(REMINDER_PRIORITIES)
export const reminderStatusSchema = z.enum(REMINDER_STATUSES)

export const createReminderSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  priority: reminderPrioritySchema.default('medium'),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid date format' })
    .optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
})

export const updateReminderSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').nullable().optional(),
  priority: reminderPrioritySchema.optional(),
  status: reminderStatusSchema.optional(),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid date format' })
    .nullable()
    .optional(),
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
})

export const listRemindersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: reminderStatusSchema.optional(),
  priority: reminderPrioritySchema.optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z
    .string()
    .regex(/^#[\da-f]{6}$/i, 'Invalid hex color')
    .default('#6366f1'),
  icon: z.string().max(50).optional(),
})

export const bulkOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID required').max(100, 'Too many IDs'),
})

export type CreateReminderInput = z.infer<typeof createReminderSchema>
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>
export type ListRemindersQuery = z.infer<typeof listRemindersQuerySchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type BulkOperationInput = z.infer<typeof bulkOperationSchema>
