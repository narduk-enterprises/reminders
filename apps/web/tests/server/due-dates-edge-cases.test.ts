import { describe, it, expect } from 'vitest'
import {
  startOfDay,
  endOfDay,
  isOverdue,
  isDueToday,
  isDueWithinDays,
  formatDueDate,
  sortByUrgency,
} from '../../server/utils/due-dates'

/**
 * Additional edge case tests for due-dates utility.
 *
 * Tests boundary conditions, timezone handling, and complex sorting scenarios.
 */
describe('due-dates edge cases', () => {
  describe('startOfDay edge cases', () => {
    it('handles leap year date', () => {
      expect(startOfDay('2028-02-29T12:00:00.000Z')).toBe('2028-02-29T00:00:00.000Z')
    })

    it('handles New Year boundary', () => {
      expect(startOfDay('2027-01-01T00:00:00.001Z')).toBe('2027-01-01T00:00:00.000Z')
    })
  })

  describe('endOfDay edge cases', () => {
    it('handles leap year date', () => {
      expect(endOfDay('2028-02-29T12:00:00.000Z')).toBe('2028-02-29T23:59:59.999Z')
    })

    it('handles December 31st', () => {
      expect(endOfDay('2026-12-31T00:00:00.000Z')).toBe('2026-12-31T23:59:59.999Z')
    })
  })

  describe('isOverdue precision', () => {
    it('returns true for 1ms past due', () => {
      expect(isOverdue('2026-03-24T12:00:00.000Z', '2026-03-24T12:00:00.001Z')).toBe(true)
    })

    it('handles very old dates', () => {
      expect(isOverdue('2000-01-01T00:00:00.000Z', '2026-03-24T12:00:00.000Z')).toBe(true)
    })

    it('handles very far future dates', () => {
      expect(isOverdue('2099-12-31T23:59:59.999Z', '2026-03-24T12:00:00.000Z')).toBe(false)
    })
  })

  describe('isDueToday cross-day boundary', () => {
    it('start of day vs end of same day are same day', () => {
      expect(isDueToday('2026-03-24T00:00:00.000Z', '2026-03-24T23:59:59.999Z')).toBe(true)
    })

    it('end of day vs start of next day are different days', () => {
      expect(isDueToday('2026-03-25T00:00:00.000Z', '2026-03-24T23:59:59.999Z')).toBe(false)
    })

    it('handles month boundary', () => {
      expect(isDueToday('2026-03-31T12:00:00.000Z', '2026-04-01T00:00:00.000Z')).toBe(false)
    })
  })

  describe('isDueWithinDays precision', () => {
    it('returns false for due date 1ms past boundary', () => {
      // Due in exactly 1 day + 1ms should be outside 1-day window
      const now = '2026-03-24T12:00:00.000Z'
      const due = '2026-03-25T12:00:00.001Z'
      expect(isDueWithinDays(due, 1, now)).toBe(false)
    })

    it('returns true for due date 1ms before boundary', () => {
      const now = '2026-03-24T12:00:00.000Z'
      const due = '2026-03-25T11:59:59.999Z'
      expect(isDueWithinDays(due, 1, now)).toBe(true)
    })

    it('handles 0 days range (same instant)', () => {
      const now = '2026-03-24T12:00:00.000Z'
      expect(isDueWithinDays(now, 0, now)).toBe(true)
    })

    it('handles large day ranges', () => {
      expect(isDueWithinDays('2026-06-24T12:00:00.000Z', 90, '2026-03-24T12:00:00.000Z')).toBe(
        false,
      ) // 92 days
    })
  })

  describe('formatDueDate edge cases', () => {
    it('handles same timestamp as now', () => {
      const now = '2026-03-24T12:00:00.000Z'
      expect(formatDueDate(now, now)).toBe('Due today')
    })

    it('handles exactly 7 days ahead', () => {
      const result = formatDueDate('2026-03-31T12:00:00.000Z', '2026-03-24T12:00:00.000Z')
      expect(result).toMatch(/^Due in 7 days$/)
    })

    it('handles 8 days ahead (should show date)', () => {
      const result = formatDueDate('2026-04-01T12:00:00.000Z', '2026-03-24T12:00:00.000Z')
      expect(result).toMatch(/^Due \w+ \d+$/)
    })

    it('handles month with single digit day', () => {
      const result = formatDueDate('2026-05-05T12:00:00.000Z', '2026-03-24T12:00:00.000Z')
      expect(result).toMatch(/^Due May 5$/)
    })

    it('handles far past date', () => {
      expect(formatDueDate('2020-01-01T00:00:00.000Z', '2026-03-24T12:00:00.000Z')).toBe(
        'Overdue',
      )
    })

    it('yesterday shows as overdue', () => {
      expect(formatDueDate('2026-03-23T12:00:00.000Z', '2026-03-24T12:00:00.000Z')).toBe(
        'Overdue',
      )
    })
  })

  describe('sortByUrgency complex scenarios', () => {
    it('handles mixed priorities with and without due dates', () => {
      const items = [
        { priority: 'low', dueDate: '2026-03-25T00:00:00.000Z' },
        { priority: 'urgent', dueDate: null },
        { priority: 'high', dueDate: '2026-03-24T00:00:00.000Z' },
        { priority: 'medium', dueDate: '2026-03-26T00:00:00.000Z' },
        { priority: 'urgent', dueDate: '2026-03-23T00:00:00.000Z' },
      ]
      const sorted = sortByUrgency(items)

      // Urgent items first
      expect(sorted[0]!.priority).toBe('urgent')
      expect(sorted[1]!.priority).toBe('urgent')
      // Among urgent: one with date first, null last
      expect(sorted[0]!.dueDate).toBe('2026-03-23T00:00:00.000Z')
      expect(sorted[1]!.dueDate).toBeNull()
      // Then high
      expect(sorted[2]!.priority).toBe('high')
      // Then medium
      expect(sorted[3]!.priority).toBe('medium')
      // Then low
      expect(sorted[4]!.priority).toBe('low')
    })

    it('sorts equal priorities by due date ascending', () => {
      const items = [
        { priority: 'medium', dueDate: '2026-04-01T00:00:00.000Z' },
        { priority: 'medium', dueDate: '2026-03-01T00:00:00.000Z' },
        { priority: 'medium', dueDate: '2026-03-15T00:00:00.000Z' },
      ]
      const sorted = sortByUrgency(items)
      expect(sorted.map((i) => i.dueDate)).toEqual([
        '2026-03-01T00:00:00.000Z',
        '2026-03-15T00:00:00.000Z',
        '2026-04-01T00:00:00.000Z',
      ])
    })

    it('handles all same priority and no due dates', () => {
      const items = [
        { priority: 'medium', dueDate: null },
        { priority: 'medium', dueDate: null },
        { priority: 'medium', dueDate: null },
      ]
      const sorted = sortByUrgency(items)
      expect(sorted).toHaveLength(3)
      expect(sorted.every((i) => i.priority === 'medium')).toBe(true)
    })

    it('handles undefined dueDate same as null', () => {
      const items = [
        { priority: 'high', dueDate: undefined },
        { priority: 'high', dueDate: '2026-03-25T00:00:00.000Z' },
      ]
      const sorted = sortByUrgency(items)
      expect(sorted[0]!.dueDate).toBe('2026-03-25T00:00:00.000Z')
    })

    it('preserves all items (no loss)', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        priority: REMINDER_PRIORITIES[i % 4]!,
        dueDate: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
      }))
      const sorted = sortByUrgency(items)
      expect(sorted).toHaveLength(20)
    })
  })
})

const REMINDER_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
