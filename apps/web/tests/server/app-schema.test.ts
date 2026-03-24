import { describe, it, expect, vi } from 'vitest'
import { categories, reminders } from '../../server/database/app-schema'

// Mock the layer schema import — vi.mock calls are hoisted by vitest
vi.mock('#layer/server/database/schema', () => ({
  users: { id: 'id' },
}))

describe('app-schema', () => {
  describe('categories table', () => {
    it('exports a categories table definition', () => {
      expect(categories).toBeDefined()
    })

    it('has expected column names', () => {
      const columnNames = Object.keys(categories)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('userId')
      expect(columnNames).toContain('name')
      expect(columnNames).toContain('color')
      expect(columnNames).toContain('icon')
      expect(columnNames).toContain('createdAt')
    })
  })

  describe('reminders table', () => {
    it('exports a reminders table definition', () => {
      expect(reminders).toBeDefined()
    })

    it('has expected column names', () => {
      const columnNames = Object.keys(reminders)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('userId')
      expect(columnNames).toContain('categoryId')
      expect(columnNames).toContain('title')
      expect(columnNames).toContain('description')
      expect(columnNames).toContain('priority')
      expect(columnNames).toContain('status')
      expect(columnNames).toContain('dueDate')
      expect(columnNames).toContain('completedAt')
      expect(columnNames).toContain('createdAt')
      expect(columnNames).toContain('updatedAt')
    })
  })

  describe('type exports', () => {
    it('modules export the tables', () => {
      // Verify that the module exports both tables
      expect(typeof categories).toBe('object')
      expect(typeof reminders).toBe('object')
    })
  })
})
