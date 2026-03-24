---
description:
  Reusable workflow for creating and building any new app from narduk-nuxt-template
  in a fresh GitHub repository — covers provisioning, setup, agent build prompt
  generation, and deployment
---

# Create a New App from Template

Use this workflow any time you need to bootstrap a brand-new application from
`narduk-nuxt-template` and hand it off to a coding agent.

---

## Step 1: Choose an App Idea

If you don't already have an idea, run the `/generate-app-idea` workflow
(`.agents/workflows/generate-app-idea.md`). It will brainstorm 10 ideas suited
to the stack, let you pick one, and generate a tailored build prompt
automatically.

If you already know what you want to build, continue to Step 2.

---

## Step 2: Provision the Repository

The control plane creates the GitHub repository, provisions D1 and Doppler,
registers the app in the fleet, and performs the first deploy:

```bash
curl -X POST https://control-plane.nard.uk/api/fleet/provision \
  -H "Authorization: Bearer $PROVISION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name":        "<app-name>",
    "displayName": "<Display Name>",
    "url":         "https://<app-name>.nard.uk"
  }'
```

Poll for completion (status becomes `complete` in ~5 minutes):

```bash
curl https://control-plane.nard.uk/api/fleet/provision/<provisionId>
```

After this step the repository exists at
`https://github.com/narduk-enterprises/<app-name>` and the app is live with a
"Coming Soon" page.

> **If the control plane is not yet available,** use the manual path:
>
> ```bash
> # 1. Clone the template
> gh repo create narduk-enterprises/<app-name> \
>   --template narduk-enterprises/narduk-nuxt-template \
>   --private --clone
> cd ~/new-code/<app-name>
>
> # 2. Run setup
> pnpm install
> pnpm run setup -- \
>   --name="<app-name>" \
>   --display="<Display Name>" \
>   --url="https://<app-name>.nard.uk"
> ```

---

## Step 3: Clone and Install Locally

```bash
git clone https://github.com/narduk-enterprises/<app-name>.git ~/new-code/<app-name>
cd ~/new-code/<app-name>
pnpm install
```

---

## Step 4: Verify the Baseline

```bash
pnpm run validate
pnpm run db:migrate
pnpm --filter <app-name> run quality
```

All three must pass with zero errors and zero warnings. Fix any pre-existing
issues before the agent starts product work — starting from a broken baseline
wastes agent cycles.

---

## Step 5: Generate the Agent Build Prompt

Use the template below to write a complete, self-contained build prompt for
the coding agent. Fill in every `<placeholder>` before handing it off.

A good prompt has four sections:

1. **Role and objective** — what the agent is, what it is building, and the
   triple mission (Build + Brand + Audit).
2. **Infrastructure verification** — commands to run before writing product
   code.
3. **Mission 1: Build** — database schema, API routes, frontend pages, quality
   gate.
4. **Mission 1b: Brand identity** — `/generate-brand-identity` workflow call
   plus mandatory template branding removal checklist.
5. **Mission 1c: SEO** — keyword targets, Schema.org requirements.
6. **Mission 2: Audit** — `audit_report.md` questions.

For a reference example, see `.agents/workflows/build-reminders-app.md`.

---

## Prompt Template

Copy and customize:

```markdown
# Role and Objective

You are an expert Nuxt 4, Cloudflare Workers, and Vue developer dropped into a
freshly scaffolded monorepo based on `narduk-nuxt-template`. The app is called
**<Display Name>** — <one sentence description of what the app does>.

**Triple mission:**
1. Build "<Display Name>" using Nuxt 4, Cloudflare D1, and Nuxt UI 4.
2. Apply a full brand identity — make it stunning and distinctive.
3. Report template friction in `audit_report.md`.

---

## Step 0: Verify the Infrastructure

```bash
pnpm run validate
pnpm run db:migrate
pnpm --filter <app-name> run quality
```

All three must pass with zero errors and zero warnings before writing a single
line of product code. Fix any pre-existing issues.

Then read `AGENTS.md` and `tools/AGENTS.md`.

---

## Mission 1: Build <Display Name>

### Database Schema

Create `apps/web/server/database/app-schema.ts`:

<Describe the tables, columns, types, and foreign keys in TypeScript using
Drizzle sqlite-core. Follow the pattern shown in the example prompt at
.agents/workflows/build-reminders-app.md>

Create `apps/web/drizzle/0001_app_tables.sql` with the corresponding CREATE
TABLE statements and indexes.

After creating the migration, run:
```bash
pnpm --filter <app-name> run db:migrate
```

### App Database Helper

Create `apps/web/server/utils/database.ts` exporting `useAppDatabase(event)`.
Do NOT name it `useDatabase` — that collides with the layer import.

### Zod Validation Schemas

Create `apps/web/server/utils/<feature>-schemas.ts` with:
<List the Zod schemas needed for create and update operations>

### API Routes

<Describe each Nitro endpoint: method, path, auth requirement, rate limit,
validation, and expected response shape>

Use `defineUserMutation`, `defineAdminMutation`, or `definePublicMutation`
from `#layer/server/utils/mutation`. Use `withValidatedBody(schema.parse)` for
all POST/PUT/PATCH bodies. Always use `#server/` aliases for imports.

### Composables

Create `apps/web/app/composables/use<Feature>.ts` for all client-side state
and data fetching. Expose reactive state and CRUD methods. Never call `$fetch`
directly in page `<script setup>`.

### Pages

<List each route with its requirements>

Each page must call `useSeo()` and `useWebPageSchema()` (or appropriate
Schema.org type). Protect authenticated routes with
`definePageMeta({ middleware: 'auth' })`.

### Quality Gate

```bash
pnpm --filter <app-name> run quality
```

Zero errors, zero warnings. No suppressions.

---

## Mission 1b: Brand Identity

Run the `/generate-brand-identity` workflow
(`.agents/workflows/generate-brand-identity.md`) end-to-end. Make all creative
decisions yourself.

Brand direction:
- **Mood:** <one word — e.g. calm, energetic, professional, playful>
- **Colors:** <primary color direction>
- **Typography:** <font style direction>
- **Logo:** <brief description — must work as 16×16 favicon and 180×180 icon>

### Mandatory template branding removal

1. Delete the N4 / green Nuxt logo anywhere it appears.
2. Remove or redesign the default navbar (never ship "Home + color toggle").
3. Replace all "Nuxt 4", "N4", "Demo", "Template" text in the UI.
4. Rebuild `apps/web/app/pages/index.vue` — do NOT ship the "Coming Soon"
   placeholder.
5. Set `colorMode: { preference: 'light' }` in `nuxt.config.ts`.

---

## Mission 1c: SEO Excellence

- `useSeo()` and Schema.org on every page with keyword-rich content.
- Clear `<h1>` and proper heading hierarchy on the landing page.
- Custom OG images per page.
- Verify sitemap.xml and robots.txt.
- Target keywords: <list 3–5 long-tail keywords for this app>

---

## Mission 2: Template Audit

Create `audit_report.md` answering:
1. Did `pnpm run validate` pass out of the box?
2. Did the D1 migration and wrangler binding work?
3. Did layer inheritance work seamlessly?
4. Were there pre-existing TypeScript errors?
5. Was the documentation accurate and complete?
6. Any HMR, Tailwind, or Doppler issues?

## Final Deliverables

- Working <Display Name> app, zero errors, zero warnings.
- Custom brand identity with logo, favicons, and theme.
- `audit_report.md` with honest feedback.
```

---

## Step 6: Invoke the Coding Agent

### GitHub Copilot coding agent

1. Open the new repository on github.com.
2. Create a new issue and paste the filled-in prompt as the body.
3. Assign the issue to **@github-copilot**.
4. The agent will open a pull request.

> The agent reads `.github/copilot-instructions.md` and `AGENTS.md`
> automatically — you do not need to repeat those rules in the prompt.

### Antigravity

Open the repository in Antigravity and paste the prompt into a new session, or
run the workflow directly if it has been committed as a `.agents/workflows/`
file:

```
/<workflow-name>
```

### Other agents (Cursor, Codex, Claude)

Copy the prompt as the first user message. Make sure the agent has the repo
checked out and can read / write files.

---

## Step 7: Review and Merge

1. Review the pull request diff for correctness and completeness.
2. Run quality checks locally:
   ```bash
   pnpm --filter <app-name> run quality
   ```
3. Smoke-test the local dev server:
   ```bash
   doppler run --config dev -- pnpm run dev
   ```

---

## Step 8: Deploy

```bash
# Remote D1 migration
cd apps/web && pnpm run db:migrate -- --remote
cd ../..

# Deploy to Cloudflare Workers
pnpm run ship
```

---

## Ongoing: Keeping the App in Sync with the Template

After the initial deploy, pull template improvements periodically:

```bash
# Full managed sync (tooling + layer)
pnpm run sync-template -- --from ~/new-code/narduk-nuxt-template

# Layer-only sync
pnpm run update-layer -- --from ~/new-code/narduk-nuxt-template
```

Commit and redeploy after each sync:

```bash
git add . && git commit -m "chore: sync template infrastructure"
pnpm run ship
```

---

## Checklist

- [ ] App idea chosen and named
- [ ] Repository provisioned (control plane or manual)
- [ ] Cloned and `pnpm install` run
- [ ] `pnpm run validate` passes
- [ ] `pnpm run db:migrate` passes
- [ ] `pnpm --filter <app-name> run quality` passes (zero errors, zero
      warnings)
- [ ] Build prompt written and reviewed
- [ ] Coding agent invoked
- [ ] PR reviewed and merged
- [ ] Remote D1 migration run
- [ ] Deployed via `pnpm run ship`
- [ ] `audit_report.md` reviewed and template issues filed upstream
