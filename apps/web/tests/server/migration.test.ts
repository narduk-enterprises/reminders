import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Tests for the database migration SQL file.
 *
 * Verifies that the migration file is syntactically valid and contains
 * the expected table definitions and constraints.
 */
const migrationPath = resolve(__dirname, '../../drizzle/0000_reminders_and_categories.sql')
const migrationSql = readFileSync(migrationPath, 'utf-8')

describe('migration: 0000_reminders_and_categories.sql', () => {
  it('creates categories table', () => {
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS `categories`')
  })

  it('creates reminders table', () => {
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS `reminders`')
  })

  describe('categories table columns', () => {
    it('has id as primary key', () => {
      expect(migrationSql).toMatch(/`id` text PRIMARY KEY NOT NULL/)
    })

    it('has user_id with cascade delete', () => {
      expect(migrationSql).toContain('`user_id` text NOT NULL')
      // Categories table foreign key
      expect(migrationSql).toMatch(
        /FOREIGN KEY \(`user_id`\) REFERENCES `users`\(`id`\) ON DELETE CASCADE/,
      )
    })

    it('has name column', () => {
      expect(migrationSql).toContain('`name` text NOT NULL')
    })

    it('has color with default', () => {
      expect(migrationSql).toMatch(/`color` text NOT NULL DEFAULT '#6366f1'/)
    })

    it('has optional icon column', () => {
      expect(migrationSql).toContain('`icon` text')
    })

    it('has created_at timestamp', () => {
      expect(migrationSql).toContain('`created_at` text NOT NULL')
    })
  })

  describe('reminders table columns', () => {
    it('has id as primary key', () => {
      // Match only inside the reminders table context
      const remindersSection = migrationSql.split('CREATE TABLE IF NOT EXISTS `reminders`')[1]!
      expect(remindersSection).toContain('`id` text PRIMARY KEY NOT NULL')
    })

    it('has user_id foreign key with cascade delete', () => {
      const remindersSection = migrationSql.split('CREATE TABLE IF NOT EXISTS `reminders`')[1]!
      expect(remindersSection).toContain(
        'FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE',
      )
    })

    it('has category_id foreign key with set null on delete', () => {
      expect(migrationSql).toContain(
        'FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL',
      )
    })

    it('has title column', () => {
      const remindersSection = migrationSql.split('CREATE TABLE IF NOT EXISTS `reminders`')[1]!
      expect(remindersSection).toContain('`title` text NOT NULL')
    })

    it('has optional description', () => {
      expect(migrationSql).toContain('`description` text')
    })

    it('has priority with default medium', () => {
      expect(migrationSql).toMatch(/`priority` text NOT NULL DEFAULT 'medium'/)
    })

    it('has status with default pending', () => {
      expect(migrationSql).toMatch(/`status` text NOT NULL DEFAULT 'pending'/)
    })

    it('has optional due_date', () => {
      expect(migrationSql).toContain('`due_date` text')
    })

    it('has optional completed_at', () => {
      expect(migrationSql).toContain('`completed_at` text')
    })

    it('has timestamps', () => {
      const remindersSection = migrationSql.split('CREATE TABLE IF NOT EXISTS `reminders`')[1]!
      expect(remindersSection).toContain('`created_at` text NOT NULL')
      expect(remindersSection).toContain('`updated_at` text NOT NULL')
    })
  })

  describe('table ordering', () => {
    it('creates categories before reminders (for foreign key dependency)', () => {
      const categoriesPos = migrationSql.indexOf('CREATE TABLE IF NOT EXISTS `categories`')
      const remindersPos = migrationSql.indexOf('CREATE TABLE IF NOT EXISTS `reminders`')
      expect(categoriesPos).toBeLessThan(remindersPos)
    })
  })
})
