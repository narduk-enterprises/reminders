---
description:
  Full agentic build prompt for the Reminders app — implements auth, CRUD
  reminders, dashboard, landing page, and brand identity on top of the
  narduk-nuxt-template shell
---

# Build the Reminders App

You are an expert Nuxt 4, Cloudflare Workers, and Vue developer dropped into a
freshly scaffolded monorepo based on `narduk-nuxt-template`. The app is called
**Reminders** — a personal task and reminder manager that lets users create,
manage, and track reminders with due dates, priorities, and categories.

**You have a triple mission:**

1. **Build "Reminders"** — a fully functional reminder management app using
   Nuxt 4, Cloudflare D1, and Nuxt UI 4.
2. **Brand Identity & SEO Excellence** — make it stunning, distinctive, and
   highly discoverable.
3. **Template Audit** — report friction, broken types, or tooling failures in
   `audit_report.md`.

---

## Step 0: Verify the Infrastructure

Confirm the git remote is set correctly:

```bash
git remote -v
```

If no remote or it still points to the template, fix it:

```bash
git remote remove origin 2>/dev/null
git remote add origin https://github.com/narduk-enterprises/reminders.git
```

Verify the local environment is healthy:

```bash
pnpm run validate
pnpm run db:migrate
pnpm --filter web run quality
```

All three must pass with zero errors and zero warnings before you write a
single line of product code. Fix any pre-existing issues before proceeding.

Then read `AGENTS.md` and `tools/AGENTS.md`.

---

## Mission 1: Build the Reminders App

Build everything inside `apps/web/`. Do not touch `layers/narduk-nuxt-layer/`
unless you discover a genuine layer-level bug.

### 1a. Database Schema

Create `apps/web/server/database/app-schema.ts` with the following table
(replace the empty export that already exists):

```ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from '#layer/server/database/schema'

export const reminders = sqliteTable('reminders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueAt: text('due_at'), // ISO-8601 string
  priority: text('priority', { enum: ['low', 'medium', 'high'] })
    .notNull()
    .default('medium'),
  category: text('category'),
  isCompleted: integer('is_completed', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})
```

`apps/web/server/database/schema.ts` already re-exports the layer schema and
`app-schema.ts` — do not change it.

Create the migration file `apps/web/drizzle/0001_reminders.sql`:

```sql
CREATE TABLE IF NOT EXISTS reminders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  description TEXT,
  due_at      TEXT,
  priority    TEXT    NOT NULL DEFAULT 'medium',
  category    TEXT,
  is_completed INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_at  ON reminders(due_at);
```

After creating the migration file, apply it locally:

```bash
pnpm --filter web run db:migrate
```

### 1b. App Database Helper

Create `apps/web/server/utils/database.ts`:

```ts
import { drizzle } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
import * as schema from '#server/database/schema'

export function useAppDatabase(event: H3Event) {
  return drizzle(event.context.cloudflare.env.DB, { schema })
}
```

> ⚠️ **Never** name this helper `useDatabase`. That collides with the
> layer-provided import and causes "Duplicated imports" Nitro warnings.

### 1c. Zod Validation Schemas

Create `apps/web/server/utils/reminder-schemas.ts`:

```ts
import { z } from 'zod'

export const createReminderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueAt: z.string().datetime({ offset: true }).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().max(50).optional(),
})

export const updateReminderSchema = createReminderSchema
  .partial()
  .extend({ isCompleted: z.boolean().optional() })
```

### 1d. API Routes

Use `#server/` aliases for all imports. Use the shared mutation wrappers from
the layer.

**`apps/web/server/api/reminders/index.get.ts`** — list reminders for the
authenticated user:

```ts
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const db = useAppDatabase(event)
  const { reminders } = await import('#server/database/schema')

  return db
    .select()
    .from(reminders)
    .where(eq(reminders.userId, user.user.id))
    .orderBy(asc(reminders.createdAt))
})
```

**`apps/web/server/api/reminders/index.post.ts`** — create a reminder:

```ts
import { createReminderSchema } from '#server/utils/reminder-schemas'

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT_POLICIES.apiWrite,
    parseBody: withValidatedBody(createReminderSchema.parse),
  },
  async ({ event, user, body }) => {
    const db = useAppDatabase(event)
    const { reminders } = await import('#server/database/schema')
    const now = new Date().toISOString()

    const [reminder] = await db
      .insert(reminders)
      .values({
        userId: user.id,
        ...body,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return reminder
  },
)
```

**`apps/web/server/api/reminders/[id].patch.ts`** — update a reminder:

```ts
import { eq, and } from 'drizzle-orm'
import { updateReminderSchema } from '#server/utils/reminder-schemas'

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT_POLICIES.apiWrite,
    parseBody: withValidatedBody(updateReminderSchema.parse),
  },
  async ({ event, user, body }) => {
    const db = useAppDatabase(event)
    const { reminders } = await import('#server/database/schema')
    const id = Number(getRouterParam(event, 'id'))

    const [updated] = await db
      .update(reminders)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(and(eq(reminders.id, id), eq(reminders.userId, user.id)))
      .returning()

    if (!updated) throw createError({ statusCode: 404 })
    return updated
  },
)
```

**`apps/web/server/api/reminders/[id].delete.ts`** — delete a reminder:

```ts
import { eq, and } from 'drizzle-orm'

export default defineUserMutation(
  { rateLimit: RATE_LIMIT_POLICIES.apiWrite },
  async ({ event, user }) => {
    const db = useAppDatabase(event)
    const { reminders } = await import('#server/database/schema')
    const id = Number(getRouterParam(event, 'id'))

    const [deleted] = await db
      .delete(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, user.id)))
      .returning()

    if (!deleted) throw createError({ statusCode: 404 })
    return { ok: true }
  },
)
```

### 1e. Composable

Create `apps/web/app/composables/useReminders.ts` for all client-side state
and data fetching. The composable should expose:

- `reminders` — `Ref<Reminder[]>` populated via `useFetch`
- `pending` — loading state
- `createReminder(data)` — optimistic create
- `updateReminder(id, data)` — optimistic update (toggle complete, edit)
- `deleteReminder(id)` — optimistic delete

Follow the thin-component / thick-composable pattern. Never call `$fetch`
directly in page `<script setup>` — proxy all data fetching through this
composable.

### 1f. Pages

Create the following pages. Each must call `useSeo()` and a Schema.org helper.

**`apps/web/app/pages/index.vue`** — Landing page (replace the placeholder):

- A compelling hero section describing Reminders — "Never forget what matters."
- A features grid (3–4 cards): Smart due dates, Priority levels, Categories,
  Works offline).
- A clear call-to-action linking to `/auth/login` and `/auth/register`.
- Use `UPageHero`, `UPageGrid`, `UPageCard`, `UPageCTA` from the layer.

**`apps/web/app/pages/dashboard.vue`** — Authenticated reminder dashboard:

- Protect with `definePageMeta({ middleware: 'auth' })`.
- Top bar with an "Add reminder" `UButton` that opens a `UModal` slide-over.
- Filter tabs: All | Today | Upcoming | Completed.
- Each reminder rendered as a `UCard` with title, description, due date badge,
  priority badge, category chip, complete checkbox, and delete button.
- Empty state illustration and copy when there are no reminders in the active
  filter.
- The "Add reminder" modal contains a `UForm` backed by `createReminderSchema`.

**`apps/web/app/pages/reminders/[id].vue`** — Reminder detail/edit page:

- Full editable form for a single reminder.
- Breadcrumb back to dashboard.
- Delete confirmation using `UModal`.

The auth pages (`/auth/login`, `/auth/register`, `/auth/forgot-password`) are
already provided by the layer — do not recreate them.

### 1g. Quality Gate

After building all features, run the quality check and fix every error and
warning before proceeding:

```bash
pnpm --filter web run quality
```

**CRITICAL RULE:** Zero errors, zero warnings. Do NOT use `@ts-expect-error`,
`eslint-disable`, or any suppression comments. Fix the root cause.

---

## Mission 1b: Brand Identity

Once the app is built and functional, run the `/generate-brand-identity`
workflow (`.agents/workflows/generate-brand-identity.md`) end-to-end. **Do not
ask any questions** — you are the creative director. Make all decisions
yourself and execute the full pipeline.

Key brand direction for Reminders:

- **Mood:** Calm, focused, productive. Think clear-headed mornings.
- **Color direction:** A trustworthy teal or indigo primary with clean neutral
  grays. Light mode default (`colorMode: { preference: 'light' }` in
  `nuxt.config.ts`).
- **Typography:** A clean, readable sans-serif (Inter or Plus Jakarta Sans).
- **Logo:** A simple checkmark or bell icon rendered as an SVG; must work as a
  16×16 favicon and 180×180 app icon.

### Mandatory template branding removal

1. Delete the "N4" / green Nuxt logo from any header or navbar.
2. The default navbar with just "Home" and a color toggle is **unacceptable**.
   Either remove it entirely or replace it with the app's own logo + meaningful
   links (e.g., Features, Login, Sign up for logged-out; Dashboard, Account,
   Logout for logged-in).
3. Replace all occurrences of "Nuxt 4", "N4", "Demo", "Template" in UI text.
4. Rebuild `apps/web/app/pages/index.vue` from scratch — do not ship the
   placeholder "Coming Soon" page.

---

## Mission 1c: SEO Excellence

- Every page must call `useSeo()` with keyword-rich titles and descriptions.
- Every page must call `useWebPageSchema()` or an appropriate Schema.org type.
- The landing page must have a clear `<h1>` and proper heading hierarchy.
- OG images must be customized per page.
- Verify `sitemap.xml` and `robots.txt` are generated correctly.
- Target long-tail keywords: "online reminder app", "free task reminders",
  "simple reminder manager".

---

## Mission 2: Template Audit

Create `audit_report.md` in the repo root answering:

1. Did `pnpm run validate` pass out of the box?
2. Did `pnpm run db:migrate` work without errors?
3. Did the layer's mutation wrappers (`defineUserMutation`, etc.) work as
   documented?
4. Were there any pre-existing TypeScript errors from
   `pnpm --filter web run quality`?
5. Did the `AGENTS.md` documentation accurately guide you? What was missing?
6. Any HMR port collisions, Tailwind issues, or Doppler errors?
7. Any friction with the `#server/` alias or `#layer/` alias resolution?

Be brutally honest. This feedback directly improves the template for future
apps.

---

## Final Deliverables

- Working Reminders app with auth, CRUD, dashboard, and landing page.
- Custom brand identity — logo, favicons, theme colors, typography.
- `audit_report.md` with honest template feedback.
- **ZERO errors and ZERO warnings** (TypeScript, ESLint, Build).
