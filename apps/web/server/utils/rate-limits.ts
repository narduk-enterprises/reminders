import type { RateLimitPolicy } from '#layer/server/utils/rateLimit'

export const REMINDERS_WRITE_POLICY: RateLimitPolicy = {
  namespace: 'reminders:write',
  maxRequests: 60,
  windowMs: 60_000,
}
