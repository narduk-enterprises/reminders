import type { RateLimitPolicy } from '#layer/server/utils/rateLimit'

const MINUTE = 60_000

export const APP_RATE_LIMITS = {
  remindersRead: { namespace: 'reminders-read', maxRequests: 60, windowMs: MINUTE },
  remindersWrite: { namespace: 'reminders-write', maxRequests: 30, windowMs: MINUTE },
  categoriesRead: { namespace: 'categories-read', maxRequests: 60, windowMs: MINUTE },
  categoriesWrite: { namespace: 'categories-write', maxRequests: 30, windowMs: MINUTE },
  remindersBulk: { namespace: 'reminders-bulk', maxRequests: 10, windowMs: MINUTE },
} as const satisfies Record<string, RateLimitPolicy>
