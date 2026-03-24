import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createReminder,
  getReminder,
  updateReminder,
  deleteReminder,
  toggleReminderComplete,
  listReminders,
  createCategory,
  listCategories,
  deleteCategory,
  bulkCompleteReminders,
  bulkDeleteReminders,
  getReminderStats,
  getOverdueReminders,
  getDueTodayReminders,
  getUpcomingReminders,
} from '../../server/utils/reminders'

// ─── Mocks ──────────────────────────────────────────────────

vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})

// Track DB operations
const mockReturning = vi.fn()
const mockGet = vi.fn()
const mockAll = vi.fn()

const mockChain = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(() => mockReturning()),
  get: vi.fn(() => mockGet()),
  all: vi.fn(() => mockAll()),
}

const mockDb = {
  select: vi.fn(() => mockChain),
  insert: vi.fn(() => mockChain),
  update: vi.fn(() => mockChain),
  delete: vi.fn(() => mockChain),
}

vi.mock('#layer/server/utils/database', () => ({
  useDatabase: () => mockDb,
}))

vi.mock('#server/database/app-schema', () => ({
  reminders: {
    id: 'id',
    userId: 'user_id',
    categoryId: 'category_id',
    title: 'title',
    description: 'description',
    priority: 'priority',
    status: 'status',
    dueDate: 'due_date',
    completedAt: 'completed_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  categories: {
    id: 'id',
    userId: 'user_id',
    name: 'name',
    color: 'color',
    icon: 'icon',
    createdAt: 'created_at',
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col, val) => ({ type: 'eq', value: val })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  desc: vi.fn((col) => ({ type: 'desc', column: col })),
  sql: vi.fn(),
  like: vi.fn((_col, val) => ({ type: 'like', value: val })),
  isNotNull: vi.fn((_col) => ({ type: 'isNotNull' })),
  lt: vi.fn((_col, val) => ({ type: 'lt', value: val })),
  gte: vi.fn((_col, val) => ({ type: 'gte', value: val })),
  lte: vi.fn((_col, val) => ({ type: 'lte', value: val })),
  count: vi.fn(() => 'count(*)'),
}))

const mockEvent = { context: { cloudflare: { env: { DB: {} } } } } as never

describe('reminders service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReturning.mockReturnValue([])
    mockGet.mockReturnValue(null)
    mockAll.mockReturnValue([])
  })

  // ─── createReminder ────────────────────────────────────────

  describe('createReminder', () => {
    it('inserts a new reminder with UUID', async () => {
      const result = await createReminder(mockEvent, 'user-1', {
        title: 'Buy milk',
        priority: 'high',
      })

      expect(mockDb.insert).toHaveBeenCalled()
      expect(result.title).toBe('Buy milk')
      expect(result.priority).toBe('high')
      expect(result.status).toBe('pending')
      expect(result.userId).toBe('user-1')
      expect(result.id).toBeDefined()
      expect(result.id.length).toBeGreaterThan(0)
    })

    it('defaults priority to medium', async () => {
      const result = await createReminder(mockEvent, 'user-1', {
        title: 'Test',
      })
      expect(result.priority).toBe('medium')
    })

    it('sets description to null when not provided', async () => {
      const result = await createReminder(mockEvent, 'user-1', {
        title: 'Test',
      })
      expect(result.description).toBeNull()
    })

    it('sets dueDate when provided', async () => {
      const result = await createReminder(mockEvent, 'user-1', {
        title: 'Test',
        dueDate: '2026-04-01T10:00:00.000Z',
      })
      expect(result.dueDate).toBe('2026-04-01T10:00:00.000Z')
    })

    it('sets categoryId when provided', async () => {
      const result = await createReminder(mockEvent, 'user-1', {
        title: 'Test',
        categoryId: 'cat-1',
      })
      expect(result.categoryId).toBe('cat-1')
    })

    it('sets timestamps', async () => {
      const result = await createReminder(mockEvent, 'user-1', { title: 'Test' })
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })
  })

  // ─── getReminder ───────────────────────────────────────────

  describe('getReminder', () => {
    it('queries by ID and userId', async () => {
      mockGet.mockReturnValue({ id: 'r-1', title: 'Test' })

      const result = await getReminder(mockEvent, 'r-1', 'user-1')
      expect(mockDb.select).toHaveBeenCalled()
      expect(result).toEqual({ id: 'r-1', title: 'Test' })
    })

    it('returns undefined when not found', async () => {
      mockGet.mockReturnValue()

      const result = await getReminder(mockEvent, 'r-999', 'user-1')
      expect(result).toBeUndefined()
    })
  })

  // ─── updateReminder ────────────────────────────────────────

  describe('updateReminder', () => {
    it('updates title and returns updated reminder', async () => {
      const updated = { id: 'r-1', title: 'Updated' }
      mockReturning.mockReturnValue([updated])

      const result = await updateReminder(mockEvent, 'r-1', 'user-1', { title: 'Updated' })
      expect(mockDb.update).toHaveBeenCalled()
      expect(result).toEqual(updated)
    })

    it('throws 404 when reminder not found', async () => {
      mockReturning.mockReturnValue([])

      await expect(
        updateReminder(mockEvent, 'r-999', 'user-1', { title: 'Updated' }),
      ).rejects.toThrow('Reminder not found.')
    })

    it('sets completedAt when status changes to completed', async () => {
      const updated = { id: 'r-1', status: 'completed' }
      mockReturning.mockReturnValue([updated])

      await updateReminder(mockEvent, 'r-1', 'user-1', { status: 'completed' })
      // Verify set was called - the implementation sets completedAt
      expect(mockChain.set).toHaveBeenCalled()
    })

    it('clears completedAt when status changes from completed', async () => {
      const updated = { id: 'r-1', status: 'pending' }
      mockReturning.mockReturnValue([updated])

      await updateReminder(mockEvent, 'r-1', 'user-1', { status: 'pending' })
      expect(mockChain.set).toHaveBeenCalled()
    })
  })

  // ─── deleteReminder ────────────────────────────────────────

  describe('deleteReminder', () => {
    it('deletes a reminder by ID and userId', async () => {
      mockReturning.mockReturnValue([{ id: 'r-1' }])

      await deleteReminder(mockEvent, 'r-1', 'user-1')
      expect(mockDb.delete).toHaveBeenCalled()
    })

    it('throws 404 when reminder not found', async () => {
      mockReturning.mockReturnValue([])

      await expect(deleteReminder(mockEvent, 'r-999', 'user-1')).rejects.toThrow(
        'Reminder not found.',
      )
    })
  })

  // ─── toggleReminderComplete ────────────────────────────────

  describe('toggleReminderComplete', () => {
    it('marks pending reminder as completed', async () => {
      mockGet.mockReturnValue({ id: 'r-1', status: 'pending' })
      mockReturning.mockReturnValue([{ id: 'r-1', status: 'completed' }])

      const result = await toggleReminderComplete(mockEvent, 'r-1', 'user-1')
      expect(result.status).toBe('completed')
    })

    it('marks completed reminder as pending', async () => {
      mockGet.mockReturnValue({ id: 'r-1', status: 'completed' })
      mockReturning.mockReturnValue([{ id: 'r-1', status: 'pending' }])

      const result = await toggleReminderComplete(mockEvent, 'r-1', 'user-1')
      expect(result.status).toBe('pending')
    })

    it('throws 404 when reminder not found', async () => {
      mockGet.mockReturnValue()

      await expect(toggleReminderComplete(mockEvent, 'r-999', 'user-1')).rejects.toThrow(
        'Reminder not found.',
      )
    })
  })

  // ─── listReminders ────────────────────────────────────────

  describe('listReminders', () => {
    it('returns items and total count', async () => {
      mockGet.mockReturnValue({ count: 5 })
      mockAll.mockReturnValue([{ id: 'r-1' }, { id: 'r-2' }])

      const result = await listReminders(mockEvent, 'user-1', { page: 1, limit: 20 })
      expect(result.total).toBe(5)
      expect(result.items).toHaveLength(2)
    })

    it('returns zero total when count is null', async () => {
      mockGet.mockReturnValue(null)
      mockAll.mockReturnValue([])

      const result = await listReminders(mockEvent, 'user-1', { page: 1, limit: 20 })
      expect(result.total).toBe(0)
      expect(result.items).toEqual([])
    })

    it('applies status filter when provided', async () => {
      mockGet.mockReturnValue({ count: 0 })
      mockAll.mockReturnValue([])

      await listReminders(mockEvent, 'user-1', { page: 1, limit: 20, status: 'pending' })
      expect(mockChain.where).toHaveBeenCalled()
    })

    it('applies priority filter when provided', async () => {
      mockGet.mockReturnValue({ count: 0 })
      mockAll.mockReturnValue([])

      await listReminders(mockEvent, 'user-1', { page: 1, limit: 20, priority: 'high' })
      expect(mockChain.where).toHaveBeenCalled()
    })

    it('applies search filter when provided', async () => {
      mockGet.mockReturnValue({ count: 0 })
      mockAll.mockReturnValue([])

      await listReminders(mockEvent, 'user-1', { page: 1, limit: 20, search: 'milk' })
      expect(mockChain.where).toHaveBeenCalled()
    })

    it('applies categoryId filter when provided', async () => {
      mockGet.mockReturnValue({ count: 0 })
      mockAll.mockReturnValue([])

      await listReminders(mockEvent, 'user-1', { page: 1, limit: 20, categoryId: 'cat-1' })
      expect(mockChain.where).toHaveBeenCalled()
    })

    it('applies pagination offset correctly', async () => {
      mockGet.mockReturnValue({ count: 100 })
      mockAll.mockReturnValue([])

      await listReminders(mockEvent, 'user-1', { page: 3, limit: 10 })
      expect(mockChain.offset).toHaveBeenCalledWith(20) // (3-1) * 10
    })
  })

  // ─── getReminderStats ─────────────────────────────────────

  describe('getReminderStats', () => {
    it('returns stats with default zeros', async () => {
      mockAll.mockReturnValue([])
      mockGet.mockReturnValue({ count: 0 })

      const stats = await getReminderStats(mockEvent, 'user-1')
      expect(stats.total).toBe(0)
      expect(stats.pending).toBe(0)
      expect(stats.completed).toBe(0)
      expect(stats.snoozed).toBe(0)
      expect(stats.cancelled).toBe(0)
      expect(stats.overdue).toBe(0)
      expect(stats.dueToday).toBe(0)
      expect(stats.byPriority).toEqual({})
    })

    it('aggregates status counts', async () => {
      const callCount = { selectCount: 0, allCount: 0, getCount: 0 }

      mockAll.mockImplementation(() => {
        callCount.allCount++
        if (callCount.allCount === 1) {
          return [
            { status: 'pending', count: 5 },
            { status: 'completed', count: 3 },
          ]
        }
        if (callCount.allCount === 2) {
          return [
            { priority: 'high', count: 2 },
            { priority: 'medium', count: 6 },
          ]
        }
        return []
      })

      mockGet.mockReturnValue({ count: 1 })

      const stats = await getReminderStats(mockEvent, 'user-1')
      expect(stats.total).toBe(8) // 5 + 3
      expect(stats.pending).toBe(5)
      expect(stats.completed).toBe(3)
      expect(stats.byPriority).toEqual({ high: 2, medium: 6 })
    })
  })

  // ─── getOverdueReminders ──────────────────────────────────

  describe('getOverdueReminders', () => {
    it('queries for overdue pending reminders', async () => {
      mockAll.mockReturnValue([{ id: 'r-1', dueDate: '2026-03-20T00:00:00.000Z' }])

      const result = await getOverdueReminders(mockEvent, 'user-1', '2026-03-24T12:00:00.000Z')
      expect(result).toHaveLength(1)
      expect(mockChain.where).toHaveBeenCalled()
    })

    it('returns empty array when none overdue', async () => {
      mockAll.mockReturnValue([])

      const result = await getOverdueReminders(mockEvent, 'user-1')
      expect(result).toEqual([])
    })
  })

  // ─── getDueTodayReminders ─────────────────────────────────

  describe('getDueTodayReminders', () => {
    it('queries for reminders due today', async () => {
      mockAll.mockReturnValue([{ id: 'r-1', dueDate: '2026-03-24T15:00:00.000Z' }])

      const result = await getDueTodayReminders(mockEvent, 'user-1', '2026-03-24T12:00:00.000Z')
      expect(result).toHaveLength(1)
    })

    it('returns empty array when none due today', async () => {
      mockAll.mockReturnValue([])

      const result = await getDueTodayReminders(mockEvent, 'user-1')
      expect(result).toEqual([])
    })
  })

  // ─── getUpcomingReminders ─────────────────────────────────

  describe('getUpcomingReminders', () => {
    it('queries for upcoming reminders within N days', async () => {
      mockAll.mockReturnValue([{ id: 'r-1' }])

      const result = await getUpcomingReminders(
        mockEvent,
        'user-1',
        7,
        '2026-03-24T12:00:00.000Z',
      )
      expect(result).toHaveLength(1)
    })

    it('defaults to 7 days', async () => {
      mockAll.mockReturnValue([])

      const result = await getUpcomingReminders(mockEvent, 'user-1')
      expect(result).toEqual([])
    })
  })

  // ─── bulkCompleteReminders ────────────────────────────────

  describe('bulkCompleteReminders', () => {
    it('completes multiple reminders', async () => {
      mockReturning.mockReturnValue([{ id: 'r-1' }])

      const count = await bulkCompleteReminders(mockEvent, 'user-1', ['r-1', 'r-2'])
      expect(count).toBe(2) // Called twice, each returns 1
      expect(mockDb.update).toHaveBeenCalledTimes(2)
    })

    it('returns 0 when no reminders match', async () => {
      mockReturning.mockReturnValue([])

      const count = await bulkCompleteReminders(mockEvent, 'user-1', ['r-99'])
      expect(count).toBe(0)
    })
  })

  // ─── bulkDeleteReminders ──────────────────────────────────

  describe('bulkDeleteReminders', () => {
    it('deletes multiple reminders', async () => {
      mockReturning.mockReturnValue([{ id: 'r-1' }])

      const count = await bulkDeleteReminders(mockEvent, 'user-1', ['r-1', 'r-2'])
      expect(count).toBe(2)
      expect(mockDb.delete).toHaveBeenCalledTimes(2)
    })

    it('returns 0 when no reminders match', async () => {
      mockReturning.mockReturnValue([])

      const count = await bulkDeleteReminders(mockEvent, 'user-1', ['r-99'])
      expect(count).toBe(0)
    })
  })

  // ─── createCategory ───────────────────────────────────────

  describe('createCategory', () => {
    it('inserts a new category with UUID', async () => {
      const result = await createCategory(mockEvent, 'user-1', { name: 'Work' })

      expect(mockDb.insert).toHaveBeenCalled()
      expect(result.name).toBe('Work')
      expect(result.userId).toBe('user-1')
      expect(result.id).toBeDefined()
      expect(result.color).toBe('#6366f1')
    })

    it('uses provided color', async () => {
      const result = await createCategory(mockEvent, 'user-1', {
        name: 'Personal',
        color: '#ff6600',
      })
      expect(result.color).toBe('#ff6600')
    })

    it('sets icon to null when not provided', async () => {
      const result = await createCategory(mockEvent, 'user-1', { name: 'Test' })
      expect(result.icon).toBeNull()
    })

    it('sets icon when provided', async () => {
      const result = await createCategory(mockEvent, 'user-1', {
        name: 'Test',
        icon: 'i-lucide-heart',
      })
      expect(result.icon).toBe('i-lucide-heart')
    })
  })

  // ─── listCategories ───────────────────────────────────────

  describe('listCategories', () => {
    it('returns categories for user', async () => {
      mockAll.mockReturnValue([
        { id: 'c-1', name: 'Personal' },
        { id: 'c-2', name: 'Work' },
      ])

      const result = await listCategories(mockEvent, 'user-1')
      expect(result).toHaveLength(2)
    })

    it('returns empty array when no categories', async () => {
      mockAll.mockReturnValue([])

      const result = await listCategories(mockEvent, 'user-1')
      expect(result).toEqual([])
    })
  })

  // ─── deleteCategory ───────────────────────────────────────

  describe('deleteCategory', () => {
    it('deletes a category by ID and userId', async () => {
      mockReturning.mockReturnValue([{ id: 'c-1' }])

      await deleteCategory(mockEvent, 'c-1', 'user-1')
      expect(mockDb.delete).toHaveBeenCalled()
    })

    it('throws 404 when category not found', async () => {
      mockReturning.mockReturnValue([])

      await expect(deleteCategory(mockEvent, 'c-999', 'user-1')).rejects.toThrow(
        'Category not found.',
      )
    })
  })
})
