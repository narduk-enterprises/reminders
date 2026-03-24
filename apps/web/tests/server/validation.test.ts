import { describe, it, expect } from 'vitest'
import {
  createReminderSchema,
  updateReminderSchema,
  listRemindersQuerySchema,
  createCategorySchema,
  bulkOperationSchema,
  REMINDER_PRIORITIES,
  REMINDER_STATUSES,
  PRIORITY_WEIGHTS,
  PRIORITY_COLORS,
  PRIORITY_ICONS,
} from '../../server/utils/validation'

describe('validation schemas', () => {
  describe('REMINDER_PRIORITIES', () => {
    it('contains exactly four priority levels', () => {
      expect(REMINDER_PRIORITIES).toEqual(['low', 'medium', 'high', 'urgent'])
    })
  })

  describe('REMINDER_STATUSES', () => {
    it('contains exactly four statuses', () => {
      expect(REMINDER_STATUSES).toEqual(['pending', 'completed', 'snoozed', 'cancelled'])
    })
  })

  describe('PRIORITY_WEIGHTS', () => {
    it('maps each priority to a numeric weight', () => {
      expect(PRIORITY_WEIGHTS.low).toBe(1)
      expect(PRIORITY_WEIGHTS.medium).toBe(2)
      expect(PRIORITY_WEIGHTS.high).toBe(3)
      expect(PRIORITY_WEIGHTS.urgent).toBe(4)
    })

    it('has ascending weight order', () => {
      expect(PRIORITY_WEIGHTS.low).toBeLessThan(PRIORITY_WEIGHTS.medium)
      expect(PRIORITY_WEIGHTS.medium).toBeLessThan(PRIORITY_WEIGHTS.high)
      expect(PRIORITY_WEIGHTS.high).toBeLessThan(PRIORITY_WEIGHTS.urgent)
    })
  })

  describe('PRIORITY_COLORS', () => {
    it('maps each priority to a hex color', () => {
      for (const p of REMINDER_PRIORITIES) {
        expect(PRIORITY_COLORS[p]).toMatch(/^#[\da-f]{6}$/i)
      }
    })
  })

  describe('PRIORITY_ICONS', () => {
    it('maps each priority to an icon string', () => {
      for (const p of REMINDER_PRIORITIES) {
        expect(PRIORITY_ICONS[p]).toMatch(/^i-lucide-/)
      }
    })
  })

  describe('createReminderSchema', () => {
    it('accepts valid minimal input', () => {
      const result = createReminderSchema.safeParse({ title: 'Buy milk' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Buy milk')
        expect(result.data.priority).toBe('medium')
      }
    })

    it('accepts valid full input', () => {
      const result = createReminderSchema.safeParse({
        title: 'Buy milk',
        description: 'Get 2 gallons',
        priority: 'high',
        dueDate: '2026-04-01T10:00:00.000Z',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priority).toBe('high')
        expect(result.data.dueDate).toBe('2026-04-01T10:00:00.000Z')
      }
    })

    it('rejects empty title', () => {
      const result = createReminderSchema.safeParse({ title: '' })
      expect(result.success).toBe(false)
    })

    it('rejects title over 200 chars', () => {
      const result = createReminderSchema.safeParse({ title: 'x'.repeat(201) })
      expect(result.success).toBe(false)
    })

    it('rejects description over 2000 chars', () => {
      const result = createReminderSchema.safeParse({
        title: 'Valid',
        description: 'x'.repeat(2001),
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid priority', () => {
      const result = createReminderSchema.safeParse({ title: 'Test', priority: 'critical' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid dueDate format', () => {
      const result = createReminderSchema.safeParse({
        title: 'Test',
        dueDate: 'not-a-date',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid categoryId', () => {
      const result = createReminderSchema.safeParse({
        title: 'Test',
        categoryId: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })

    it('accepts all valid priorities', () => {
      for (const priority of REMINDER_PRIORITIES) {
        const result = createReminderSchema.safeParse({ title: 'Test', priority })
        expect(result.success).toBe(true)
      }
    })

    it('defaults priority to medium when not provided', () => {
      const result = createReminderSchema.safeParse({ title: 'Test' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priority).toBe('medium')
      }
    })
  })

  describe('updateReminderSchema', () => {
    it('accepts empty update (all fields optional)', () => {
      const result = updateReminderSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('accepts partial update with title only', () => {
      const result = updateReminderSchema.safeParse({ title: 'Updated title' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Updated title')
      }
    })

    it('accepts null description to clear it', () => {
      const result = updateReminderSchema.safeParse({ description: null })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBeNull()
      }
    })

    it('accepts null dueDate to clear it', () => {
      const result = updateReminderSchema.safeParse({ dueDate: null })
      expect(result.success).toBe(true)
    })

    it('accepts null categoryId to clear it', () => {
      const result = updateReminderSchema.safeParse({ categoryId: null })
      expect(result.success).toBe(true)
    })

    it('accepts all valid statuses', () => {
      for (const status of REMINDER_STATUSES) {
        const result = updateReminderSchema.safeParse({ status })
        expect(result.success).toBe(true)
      }
    })

    it('rejects invalid status', () => {
      const result = updateReminderSchema.safeParse({ status: 'archived' })
      expect(result.success).toBe(false)
    })

    it('rejects empty title', () => {
      const result = updateReminderSchema.safeParse({ title: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('listRemindersQuerySchema', () => {
    it('accepts empty query with defaults', () => {
      const result = listRemindersQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('coerces string page and limit', () => {
      const result = listRemindersQuerySchema.safeParse({ page: '3', limit: '50' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
        expect(result.data.limit).toBe(50)
      }
    })

    it('rejects page less than 1', () => {
      const result = listRemindersQuerySchema.safeParse({ page: 0 })
      expect(result.success).toBe(false)
    })

    it('rejects limit over 100', () => {
      const result = listRemindersQuerySchema.safeParse({ limit: 101 })
      expect(result.success).toBe(false)
    })

    it('accepts optional status filter', () => {
      const result = listRemindersQuerySchema.safeParse({ status: 'pending' })
      expect(result.success).toBe(true)
    })

    it('accepts optional priority filter', () => {
      const result = listRemindersQuerySchema.safeParse({ priority: 'urgent' })
      expect(result.success).toBe(true)
    })

    it('accepts optional search string', () => {
      const result = listRemindersQuerySchema.safeParse({ search: 'buy' })
      expect(result.success).toBe(true)
    })

    it('rejects search over 200 chars', () => {
      const result = listRemindersQuerySchema.safeParse({ search: 'x'.repeat(201) })
      expect(result.success).toBe(false)
    })

    it('accepts optional categoryId', () => {
      const result = listRemindersQuerySchema.safeParse({
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid categoryId', () => {
      const result = listRemindersQuerySchema.safeParse({ categoryId: 'bad' })
      expect(result.success).toBe(false)
    })
  })

  describe('createCategorySchema', () => {
    it('accepts valid minimal input', () => {
      const result = createCategorySchema.safeParse({ name: 'Work' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Work')
        expect(result.data.color).toBe('#6366f1')
      }
    })

    it('accepts valid full input', () => {
      const result = createCategorySchema.safeParse({
        name: 'Personal',
        color: '#ff6600',
        icon: 'i-lucide-heart',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = createCategorySchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('rejects name over 50 chars', () => {
      const result = createCategorySchema.safeParse({ name: 'x'.repeat(51) })
      expect(result.success).toBe(false)
    })

    it('rejects invalid hex color', () => {
      const result = createCategorySchema.safeParse({ name: 'Test', color: 'red' })
      expect(result.success).toBe(false)
    })

    it('rejects hex color without hash', () => {
      const result = createCategorySchema.safeParse({ name: 'Test', color: '6366f1' })
      expect(result.success).toBe(false)
    })

    it('accepts valid hex color', () => {
      const result = createCategorySchema.safeParse({ name: 'Test', color: '#abcdef' })
      expect(result.success).toBe(true)
    })
  })

  describe('bulkOperationSchema', () => {
    it('accepts valid array of UUIDs', () => {
      const result = bulkOperationSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty ids array', () => {
      const result = bulkOperationSchema.safeParse({ ids: [] })
      expect(result.success).toBe(false)
    })

    it('rejects more than 100 ids', () => {
      const ids = Array.from({ length: 101 }, () => '550e8400-e29b-41d4-a716-446655440000')
      const result = bulkOperationSchema.safeParse({ ids })
      expect(result.success).toBe(false)
    })

    it('rejects non-UUID strings', () => {
      const result = bulkOperationSchema.safeParse({ ids: ['not-a-uuid'] })
      expect(result.success).toBe(false)
    })

    it('accepts exactly 100 ids', () => {
      const ids = Array.from({ length: 100 }, () => '550e8400-e29b-41d4-a716-446655440000')
      const result = bulkOperationSchema.safeParse({ ids })
      expect(result.success).toBe(true)
    })
  })
})
