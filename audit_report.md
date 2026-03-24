# Template Audit Report — Reminders App

**Date:** 2026-03-24 **Template:** `narduk-nuxt-template` v1.17.2 **App:**
Reminders (narduk-enterprises/reminders)

---

## 1. Did `pnpm run validate` pass out of the box?

**Partially.** The validate script runs six checks:

| Check                 | Result | Notes                                                                                                                  |
| --------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| D1 Database existence | ❌     | Expected — requires `wrangler d1 info` with valid auth. Not available in CI/sandbox.                                   |
| wrangler.json DB ID   | ✅     | Database ID was already provisioned.                                                                                   |
| Doppler configuration | ❌     | `doppler` CLI not installed in this environment.                                                                       |
| GitHub Secrets        | ❌     | Token lacks permission to list repo secrets (HTTP 403).                                                                |
| package.json checks   | ⚠️     | `db:migrate` script still references `narduk-nuxt-template` in the layer package path — flagged as needing `--repair`. |
| Dependencies          | ✅     | drizzle-orm, zod, @cloudflare/workers-types, @iconify-json/lucide all present.                                         |

**Verdict:** The external-service checks (D1 info, Doppler, GitHub Secrets)
expectedly fail in a sandboxed CI environment. The `db:migrate` template
reference warning is cosmetic since the resolved workspace symlink works
correctly. The script would benefit from a `--ci` flag that skips
external-service validation.

---

## 2. Did `pnpm run db:migrate` work without errors?

**Yes.** Migration ran successfully:

```
⏳  Applying layer:0000_initial_schema.sql...
⏳  Applying layer:0001_kv_cache.sql...
⏳  Applying layer:0002_api_keys.sql...
⏳  Applying layer:0003_notifications.sql...
⏳  Applying layer:0004_system_prompts.sql...
✅  Migrations complete: 5 applied, 0 skipped
```

App-owned migration (`0001_reminders.sql`) also applied cleanly on a subsequent
run. The migration system correctly orders layer migrations before app
migrations.

---

## 3. Did the layer's mutation wrappers work as documented?

**Yes, with one caveat.** `defineUserMutation`, `withValidatedBody`, and the
supporting utilities (`createError`, `getRouterParam`) are all auto-imported and
work as expected.

**Caveat:** The problem statement references `RATE_LIMIT_POLICIES.apiWrite`, but
no such policy exists in the layer. The available policies are named after
specific auth/admin actions (e.g., `authLogin`, `authProfile`, `adminUsers`,
`notifications`). There is no generic `apiWrite` policy for app-level CRUD
endpoints.

**Workaround:** Defined an inline rate limit policy object
(`{ namespace: 'reminders:write', maxRequests: 60, windowMs: 60_000 }`) since
`MutationOptions.rateLimit` accepts any `RateLimitPolicy` shape.

**Suggestion:** Add a generic `apiWrite` (or `appWrite`) policy to the layer for
downstream apps that add CRUD endpoints.

---

## 4. Were there any pre-existing TypeScript errors from quality?

**No.** The scaffolded app had zero TypeScript errors and zero ESLint errors
before any product code was added.

After adding product code, three TypeScript errors surfaced:

1. **`requireUserSession` return type** — The `User` interface augmentation from
   the layer (`app/types/auth.d.ts`) was not visible to server-side TypeScript
   because the server tsconfig only includes `server/**/*`, not `app/**/*`.
   Required creating a duplicate `server/types/auth.d.ts` to augment
   `#auth-utils` for server code.

2. **Cloudflare D1 binding typing** — `event.context.cloudflare.env.DB` is typed
   as `unknown`. The layer's own `useDatabase()` uses a manual type assertion:
   `(event.context.cloudflare?.env as { DB?: D1Database })?.DB`. This pattern
   needs to be replicated by any app that creates its own database helper.

3. **Minor dashboard type cast** — Form data object needed proper typing to
   match the composable's parameter interface.

**Suggestion:** The layer should either:

- Export a typed helper for accessing the D1 binding, or
- Ensure the `auth.d.ts` augmentation is visible to both app and server
  tsconfigs.

---

## 5. Did the AGENTS.md documentation accurately guide you? What was missing?

**Mostly accurate.** The root `AGENTS.md` and `docs/agents/` documentation are
comprehensive. Key observations:

- ✅ The "Where Changes Belong" table is clear and correct.
- ✅ The non-negotiable rules are well-articulated.
- ✅ The quality commands work as documented.
- ⚠️ `tools/AGENTS.md` is referenced in root `AGENTS.md` but does not exist.
- ⚠️ `apps/web/AGENTS.md` is referenced in root `AGENTS.md` but does not exist.
- ⚠️ The `docs/agents/engineering.md` mentions `useWebPageSchema()` but doesn't
  document the full list of Schema.org helpers (found them by reading the
  source).
- ⚠️ No documentation on how to create app-level rate limit policies (only layer
  policies are documented).
- ⚠️ The `#auth-utils` User augmentation issue (server-side visibility) is not
  documented.

---

## 6. Any HMR port collisions, Tailwind issues, or Doppler errors?

- **HMR:** Not tested (sandbox environment, no dev server started).
- **Tailwind:** No issues. Tailwind v4 with `@tailwindcss/vite` works correctly.
  Nuxt UI 4 semantic colors (`text-default`, `text-muted`, `text-dimmed`,
  `bg-elevated`) all work as documented.
- **Doppler:** Not installed in this environment. The `dev` script wraps with
  `doppler run --` which would fail without the CLI. The `predev` hook
  (`db:ready`) runs first which could mask Doppler failures.

---

## 7. Any friction with the `#server/` alias or `#layer/` alias resolution?

**Minor friction:**

- `#server/` alias works correctly for both
  `import ... from '#server/database/schema'` and
  `import ... from '#server/utils/reminder-schemas'`.
- `#layer/` alias works correctly for referencing layer utilities (e.g.,
  `#layer/server/database/schema`).
- The `createAppDatabase()` factory from the layer
  (`#layer/server/utils/database`) is an alternative approach to creating an app
  database, but the documentation doesn't clearly explain when to use the
  factory vs. creating a standalone `useAppDatabase()`. Both approaches work.

---

## Additional Observations

### Private Package Registry Access

The `@narduk-enterprises/eslint-config` package is hosted on GitHub Packages
(private registry). In environments without the correct GitHub Packages token,
`pnpm install` fails entirely because pnpm rolls back partial installs. This
blocks all development, not just linting.

**Workaround:** Created a local stub package (`packages/eslint-config-stub`)
with a pnpm override to resolve the dependency from the workspace. This is
fragile and should be addressed by either:

- Making the eslint-config package available via a fallback, or
- Using workspace protocol (`workspace:*`) for all internal dependencies, or
- Documenting the required GitHub Packages token setup more prominently.

### Layer Dashboard Page Override

The layer provides a default `dashboard/index.vue` page. When the app creates
its own `dashboard.vue` (not `dashboard/index.vue`), Nuxt resolves the app page
correctly. However, this creates an implicit path collision that isn't
documented — both `/dashboard` and `/dashboard/` could resolve differently
depending on trailing slash configuration.

### Zod v4 Compatibility

The project uses `zod@^4.3.6` which uses `z.string().datetime({ offset: true })`
syntax. This works correctly. The layer's mutation wrappers handle `ZodError`
from v4 without issues.
