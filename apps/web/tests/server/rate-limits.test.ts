import { describe, it, expect } from 'vitest'
import { APP_RATE_LIMITS } from '../../server/utils/rate-limits'

describe('rate-limits', () => {
  it('exports five rate limit policies', () => {
    expect(Object.keys(APP_RATE_LIMITS)).toHaveLength(5)
  })

  it('defines remindersRead policy', () => {
    expect(APP_RATE_LIMITS.remindersRead).toEqual({
      namespace: 'reminders-read',
      maxRequests: 60,
      windowMs: 60_000,
    })
  })

  it('defines remindersWrite policy', () => {
    expect(APP_RATE_LIMITS.remindersWrite).toEqual({
      namespace: 'reminders-write',
      maxRequests: 30,
      windowMs: 60_000,
    })
  })

  it('defines categoriesRead policy', () => {
    expect(APP_RATE_LIMITS.categoriesRead).toEqual({
      namespace: 'categories-read',
      maxRequests: 60,
      windowMs: 60_000,
    })
  })

  it('defines categoriesWrite policy', () => {
    expect(APP_RATE_LIMITS.categoriesWrite).toEqual({
      namespace: 'categories-write',
      maxRequests: 30,
      windowMs: 60_000,
    })
  })

  it('defines remindersBulk policy with lower limit', () => {
    expect(APP_RATE_LIMITS.remindersBulk).toEqual({
      namespace: 'reminders-bulk',
      maxRequests: 10,
      windowMs: 60_000,
    })
  })

  it('all policies have required fields', () => {
    for (const [_name, policy] of Object.entries(APP_RATE_LIMITS)) {
      expect(policy).toHaveProperty('namespace')
      expect(policy).toHaveProperty('maxRequests')
      expect(policy).toHaveProperty('windowMs')
      expect(typeof policy.namespace).toBe('string')
      expect(policy.namespace.length).toBeGreaterThan(0)
      expect(policy.maxRequests).toBeGreaterThan(0)
      expect(policy.windowMs).toBeGreaterThan(0)
    }
  })

  it('all namespaces are unique', () => {
    const namespaces = Object.values(APP_RATE_LIMITS).map((p) => p.namespace)
    expect(new Set(namespaces).size).toBe(namespaces.length)
  })

  it('write limits are stricter than read limits', () => {
    expect(APP_RATE_LIMITS.remindersWrite.maxRequests).toBeLessThan(
      APP_RATE_LIMITS.remindersRead.maxRequests,
    )
    expect(APP_RATE_LIMITS.categoriesWrite.maxRequests).toBeLessThan(
      APP_RATE_LIMITS.categoriesRead.maxRequests,
    )
  })

  it('bulk limit is the most restrictive', () => {
    const allMaxRequests = Object.values(APP_RATE_LIMITS).map((p) => p.maxRequests)
    expect(APP_RATE_LIMITS.remindersBulk.maxRequests).toBe(Math.min(...allMaxRequests))
  })
})
