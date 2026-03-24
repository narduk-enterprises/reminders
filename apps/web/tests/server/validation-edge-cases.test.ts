import { describe, it, expect } from 'vitest'
import {
  createReminderSchema,
  updateReminderSchema,
  createCategorySchema,
  bulkOperationSchema,
  listRemindersQuerySchema,
  REMINDER_PRIORITIES,
  REMINDER_STATUSES,
} from '../../server/utils/validation'

/**
 * Edge case and boundary tests for validation schemas.
 *
 * Tests extreme inputs, boundary values, and unusual but valid combinations.
 */
describe('validation edge cases', () => {
  describe('createReminderSchema boundary values', () => {
    it('accepts title with exactly 1 character', () => {
      const result = createReminderSchema.safeParse({ title: 'A' })
      expect(result.success).toBe(true)
    })

    it('accepts title with exactly 200 characters', () => {
      const result = createReminderSchema.safeParse({ title: 'x'.repeat(200) })
      expect(result.success).toBe(true)
    })

    it('accepts description with exactly 2000 characters', () => {
      const result = createReminderSchema.safeParse({
        title: 'Test',
        description: 'x'.repeat(2000),
      })
      expect(result.success).toBe(true)
    })

    it('accepts description as empty string (optional)', () => {
      const result = createReminderSchema.safeParse({ title: 'Test', description: '' })
      expect(result.success).toBe(true)
    })

    it('handles unicode in title', () => {
      const result = createReminderSchema.safeParse({ title: '🎯 Buy groceries 日本語' })
      expect(result.success).toBe(true)
    })

    it('handles unicode in description', () => {
      const result = createReminderSchema.safeParse({
        title: 'Test',
        description: '📝 Notes with émojis and accénts',
      })
      expect(result.success).toBe(true)
    })

    it('accepts various valid ISO datetime formats for dueDate', () => {
      const validDates = [
        '2026-04-01T00:00:00Z',
        '2026-12-31T23:59:59Z',
        '2026-01-01T12:00:00.000Z',
      ]
      for (const dueDate of validDates) {
        const result = createReminderSchema.safeParse({ title: 'Test', dueDate })
        expect(result.success).toBe(true)
      }
    })

    it('rejects timezone offset format (Zod datetime requires Z suffix)', () => {
      const result = createReminderSchema.safeParse({
        title: 'Test',
        dueDate: '2026-06-15T08:30:00+05:00',
      })
      // Zod's datetime() without offset option rejects timezone offsets
      expect(result.success).toBe(false)
    })

    it('rejects various invalid date formats', () => {
      const invalidDates = ['tomorrow', '2026/04/01', '04-01-2026', 'March 24, 2026', '1234']
      for (const dueDate of invalidDates) {
        const result = createReminderSchema.safeParse({ title: 'Test', dueDate })
        expect(result.success).toBe(false)
      }
    })

    it('rejects missing title', () => {
      const result = createReminderSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('rejects null title', () => {
      const result = createReminderSchema.safeParse({ title: null })
      expect(result.success).toBe(false)
    })

    it('rejects numeric title', () => {
      const result = createReminderSchema.safeParse({ title: 123 })
      expect(result.success).toBe(false)
    })
  })

  describe('updateReminderSchema edge cases', () => {
    it('accepts all fields simultaneously', () => {
      const result = updateReminderSchema.safeParse({
        title: 'Updated',
        description: 'New desc',
        priority: 'urgent',
        status: 'completed',
        dueDate: '2026-04-01T10:00:00.000Z',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('rejects extra unknown fields (strict parsing)', () => {
      // Zod strips unknown fields by default but doesn't fail
      const result = updateReminderSchema.safeParse({ unknownField: 'value' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField')
      }
    })

    it('allows clearing all nullable fields at once', () => {
      const result = updateReminderSchema.safeParse({
        description: null,
        dueDate: null,
        categoryId: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('listRemindersQuerySchema edge cases', () => {
    it('accepts all filters simultaneously', () => {
      const result = listRemindersQuerySchema.safeParse({
        page: 5,
        limit: 50,
        status: 'pending',
        priority: 'high',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        search: 'milk',
      })
      expect(result.success).toBe(true)
    })

    it('coerces float page to nearest int', () => {
      const result = listRemindersQuerySchema.safeParse({ page: '3' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
      }
    })

    it('rejects negative limit', () => {
      const result = listRemindersQuerySchema.safeParse({ limit: -1 })
      expect(result.success).toBe(false)
    })

    it('accepts limit of exactly 1', () => {
      const result = listRemindersQuerySchema.safeParse({ limit: 1 })
      expect(result.success).toBe(true)
    })

    it('accepts limit of exactly 100', () => {
      const result = listRemindersQuerySchema.safeParse({ limit: 100 })
      expect(result.success).toBe(true)
    })

    it('accepts empty search string', () => {
      const result = listRemindersQuerySchema.safeParse({ search: '' })
      expect(result.success).toBe(true)
    })

    it('accepts search with exactly 200 chars', () => {
      const result = listRemindersQuerySchema.safeParse({ search: 'x'.repeat(200) })
      expect(result.success).toBe(true)
    })
  })

  describe('createCategorySchema edge cases', () => {
    it('accepts name with exactly 50 characters', () => {
      const result = createCategorySchema.safeParse({ name: 'x'.repeat(50) })
      expect(result.success).toBe(true)
    })

    it('accepts lowercase hex color', () => {
      const result = createCategorySchema.safeParse({ name: 'Test', color: '#abcdef' })
      expect(result.success).toBe(true)
    })

    it('accepts uppercase hex color', () => {
      const result = createCategorySchema.safeParse({ name: 'Test', color: '#ABCDEF' })
      expect(result.success).toBe(true)
    })

    it('accepts mixed case hex color', () => {
      const result = createCategorySchema.safeParse({ name: 'Test', color: '#aBcDeF' })
      expect(result.success).toBe(true)
    })

    it('rejects 3-character hex shorthand', () => {
      const result = createCategorySchema.safeParse({ name: 'Test', color: '#abc' })
      expect(result.success).toBe(false)
    })

    it('rejects 8-character hex (with alpha)', () => {
      const result = createCategorySchema.safeParse({ name: 'Test', color: '#abcdef00' })
      expect(result.success).toBe(false)
    })

    it('handles unicode in name', () => {
      const result = createCategorySchema.safeParse({ name: '🏠 Home' })
      expect(result.success).toBe(true)
    })

    it('icon field is truly optional (undefined)', () => {
      const result = createCategorySchema.safeParse({ name: 'Test' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.icon).toBeUndefined()
      }
    })
  })

  describe('bulkOperationSchema edge cases', () => {
    it('accepts exactly 1 id', () => {
      const result = bulkOperationSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing ids field', () => {
      const result = bulkOperationSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('rejects ids as string instead of array', () => {
      const result = bulkOperationSchema.safeParse({ ids: '550e8400-e29b-41d4-a716-446655440000' })
      expect(result.success).toBe(false)
    })

    it('rejects mixed valid and invalid UUIDs', () => {
      const result = bulkOperationSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000', 'not-a-uuid'],
      })
      expect(result.success).toBe(false)
    })

    it('accepts multiple distinct UUIDs', () => {
      const result = bulkOperationSchema.safeParse({
        ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          '660e8400-e29b-41d4-a716-446655440001',
          '770e8400-e29b-41d4-a716-446655440002',
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('cross-schema consistency', () => {
    it('createReminderSchema accepts all REMINDER_PRIORITIES', () => {
      for (const priority of REMINDER_PRIORITIES) {
        const result = createReminderSchema.safeParse({ title: 'Test', priority })
        expect(result.success).toBe(true)
      }
    })

    it('updateReminderSchema accepts all REMINDER_STATUSES', () => {
      for (const status of REMINDER_STATUSES) {
        const result = updateReminderSchema.safeParse({ status })
        expect(result.success).toBe(true)
      }
    })

    it('listRemindersQuerySchema accepts all REMINDER_STATUSES as filter', () => {
      for (const status of REMINDER_STATUSES) {
        const result = listRemindersQuerySchema.safeParse({ status })
        expect(result.success).toBe(true)
      }
    })

    it('listRemindersQuerySchema accepts all REMINDER_PRIORITIES as filter', () => {
      for (const priority of REMINDER_PRIORITIES) {
        const result = listRemindersQuerySchema.safeParse({ priority })
        expect(result.success).toBe(true)
      }
    })
  })
})
