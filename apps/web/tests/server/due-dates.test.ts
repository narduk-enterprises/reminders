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

describe('due-dates', () => {
  describe('startOfDay', () => {
    it('returns midnight UTC for a datetime string', () => {
      expect(startOfDay('2026-03-24T15:30:00.000Z')).toBe('2026-03-24T00:00:00.000Z')
    })

    it('handles start-of-day input', () => {
      expect(startOfDay('2026-01-01T00:00:00.000Z')).toBe('2026-01-01T00:00:00.000Z')
    })

    it('handles end-of-day input', () => {
      expect(startOfDay('2026-12-31T23:59:59.999Z')).toBe('2026-12-31T00:00:00.000Z')
    })
  })

  describe('endOfDay', () => {
    it('returns end-of-day UTC for a datetime string', () => {
      expect(endOfDay('2026-03-24T15:30:00.000Z')).toBe('2026-03-24T23:59:59.999Z')
    })

    it('handles start-of-day input', () => {
      expect(endOfDay('2026-01-01T00:00:00.000Z')).toBe('2026-01-01T23:59:59.999Z')
    })
  })

  describe('isOverdue', () => {
    it('returns true when due date is before reference', () => {
      expect(isOverdue('2026-03-23T12:00:00.000Z', '2026-03-24T12:00:00.000Z')).toBe(true)
    })

    it('returns false when due date is after reference', () => {
      expect(isOverdue('2026-03-25T12:00:00.000Z', '2026-03-24T12:00:00.000Z')).toBe(false)
    })

    it('returns false when due date equals reference', () => {
      expect(isOverdue('2026-03-24T12:00:00.000Z', '2026-03-24T12:00:00.000Z')).toBe(false)
    })

    it('uses current time as default reference', () => {
      // A date far in the past should always be overdue
      expect(isOverdue('2000-01-01T00:00:00.000Z')).toBe(true)
    })

    it('future date is not overdue', () => {
      expect(isOverdue('2099-12-31T23:59:59.999Z')).toBe(false)
    })
  })

  describe('isDueToday', () => {
    it('returns true when due date is same calendar day', () => {
      expect(isDueToday('2026-03-24T23:59:00.000Z', '2026-03-24T08:00:00.000Z')).toBe(true)
    })

    it('returns false when due date is different day', () => {
      expect(isDueToday('2026-03-25T00:00:00.000Z', '2026-03-24T23:59:00.000Z')).toBe(false)
    })

    it('returns true for start and end of same day', () => {
      expect(isDueToday('2026-03-24T00:00:00.000Z', '2026-03-24T23:59:59.999Z')).toBe(true)
    })

    it('returns false for adjacent days', () => {
      expect(isDueToday('2026-03-23T23:59:59.999Z', '2026-03-24T00:00:00.000Z')).toBe(false)
    })
  })

  describe('isDueWithinDays', () => {
    it('returns true for due date within range', () => {
      expect(isDueWithinDays('2026-03-27T12:00:00.000Z', 7, '2026-03-24T12:00:00.000Z')).toBe(
        true,
      )
    })

    it('returns false for due date outside range', () => {
      expect(isDueWithinDays('2026-04-01T12:00:00.000Z', 3, '2026-03-24T12:00:00.000Z')).toBe(
        false,
      )
    })

    it('returns false for past due dates', () => {
      expect(isDueWithinDays('2026-03-20T12:00:00.000Z', 7, '2026-03-24T12:00:00.000Z')).toBe(
        false,
      )
    })

    it('returns true for due date exactly at boundary', () => {
      // 1 day = 86400000ms
      expect(isDueWithinDays('2026-03-25T12:00:00.000Z', 1, '2026-03-24T12:00:00.000Z')).toBe(
        true,
      )
    })

    it('returns true for due date at start of range (now)', () => {
      expect(isDueWithinDays('2026-03-24T12:00:00.000Z', 7, '2026-03-24T12:00:00.000Z')).toBe(
        true,
      )
    })
  })

  describe('formatDueDate', () => {
    it('returns "Overdue" for past dates', () => {
      expect(formatDueDate('2026-03-20T12:00:00.000Z', '2026-03-24T12:00:00.000Z')).toBe(
        'Overdue',
      )
    })

    it('returns "Due today" for same-day dates', () => {
      expect(formatDueDate('2026-03-24T18:00:00.000Z', '2026-03-24T08:00:00.000Z')).toBe(
        'Due today',
      )
    })

    it('returns "Due tomorrow" for next day', () => {
      expect(formatDueDate('2026-03-25T12:00:00.000Z', '2026-03-24T12:00:00.000Z')).toBe(
        'Due tomorrow',
      )
    })

    it('returns "Due in N days" for 2-7 days ahead', () => {
      const result = formatDueDate('2026-03-28T12:00:00.000Z', '2026-03-24T12:00:00.000Z')
      expect(result).toMatch(/^Due in \d+ days$/)
    })

    it('returns date format for dates more than 7 days ahead', () => {
      const result = formatDueDate('2026-04-15T12:00:00.000Z', '2026-03-24T12:00:00.000Z')
      expect(result).toMatch(/^Due \w+ \d+$/)
    })

    it('returns "Due in 2 days" for day after tomorrow', () => {
      const result = formatDueDate('2026-03-26T12:00:00.000Z', '2026-03-24T12:00:00.000Z')
      expect(result).toBe('Due in 2 days')
    })

    it('handles year boundary correctly', () => {
      expect(formatDueDate('2027-01-01T12:00:00.000Z', '2026-12-31T12:00:00.000Z')).toBe(
        'Due tomorrow',
      )
    })
  })

  describe('sortByUrgency', () => {
    it('sorts by priority descending (urgent first)', () => {
      const items = [
        { priority: 'low', dueDate: null },
        { priority: 'urgent', dueDate: null },
        { priority: 'medium', dueDate: null },
        { priority: 'high', dueDate: null },
      ]
      const sorted = sortByUrgency(items)
      expect(sorted.map((i) => i.priority)).toEqual(['urgent', 'high', 'medium', 'low'])
    })

    it('sorts by due date within same priority', () => {
      const items = [
        { priority: 'high', dueDate: '2026-03-30T12:00:00.000Z' },
        { priority: 'high', dueDate: '2026-03-25T12:00:00.000Z' },
        { priority: 'high', dueDate: '2026-03-28T12:00:00.000Z' },
      ]
      const sorted = sortByUrgency(items)
      expect(sorted.map((i) => i.dueDate)).toEqual([
        '2026-03-25T12:00:00.000Z',
        '2026-03-28T12:00:00.000Z',
        '2026-03-30T12:00:00.000Z',
      ])
    })

    it('pushes null due dates to end within same priority', () => {
      const items = [
        { priority: 'medium', dueDate: null },
        { priority: 'medium', dueDate: '2026-03-25T00:00:00.000Z' },
      ]
      const sorted = sortByUrgency(items)
      expect(sorted[0]!.dueDate).toBe('2026-03-25T00:00:00.000Z')
      expect(sorted[1]!.dueDate).toBeNull()
    })

    it('does not mutate the original array', () => {
      const items = [
        { priority: 'low', dueDate: null },
        { priority: 'urgent', dueDate: null },
      ]
      const original = [...items]
      sortByUrgency(items)
      expect(items).toEqual(original)
    })

    it('handles empty array', () => {
      expect(sortByUrgency([])).toEqual([])
    })

    it('handles single item array', () => {
      const items = [{ priority: 'high', dueDate: '2026-03-25T12:00:00.000Z' }]
      expect(sortByUrgency(items)).toEqual(items)
    })

    it('handles unknown priority as lowest', () => {
      const items = [
        { priority: 'low', dueDate: null },
        { priority: 'unknown', dueDate: null },
      ]
      const sorted = sortByUrgency(items)
      expect(sorted[0]!.priority).toBe('low')
      expect(sorted[1]!.priority).toBe('unknown')
    })
  })
})
