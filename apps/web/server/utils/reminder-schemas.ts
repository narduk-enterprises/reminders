import { z } from 'zod'

export const createReminderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueAt: z.string().datetime({ offset: true }).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().max(50).optional(),
})

export const updateReminderSchema = createReminderSchema
  .partial()
  .extend({ isCompleted: z.boolean().optional() })
