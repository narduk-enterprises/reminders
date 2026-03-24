/// <reference types="@cloudflare/workers-types" />
import { drizzle } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
import * as schema from '#server/database/schema'

export function useAppDatabase(event: H3Event) {
  const d1 = (event.context.cloudflare?.env as { DB?: D1Database })?.DB
  if (!d1) throw createError({ statusCode: 500, statusMessage: 'Database not available' })
  return drizzle(d1, { schema })
}
