# Next Steps

This document gives two sets of instructions:

1. **[Building the Reminders app](#1-building-the-reminders-app-with-github-coding-agents)** — how to
   use a GitHub Copilot coding agent to implement the full reminders feature set
   in this repository.
2. **[Bootstrapping future apps from the template](#2-bootstrapping-future-apps-from-narduk-nuxt-template)** —
   the repeatable workflow for provisioning a new repository from
   `narduk-nuxt-template` and having a coding agent build it out.

---

## 1. Building the Reminders App with GitHub Coding Agents

### What the agent will build

The reminders app is a personal task and reminder manager running on
Cloudflare Workers + D1. Key features:

| Area             | Scope                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Auth             | Email/password login and registration (layer-provided)                     |
| Database         | `reminders` table — id, userId, title, description, dueAt, priority, isCompleted, category |
| API              | Full CRUD at `/api/reminders` with auth guards and rate limiting           |
| Dashboard        | Paginated, filterable reminder list with inline complete/delete actions    |
| Landing page     | Public marketing page replacing the "Coming Soon" placeholder              |
| Brand identity   | Custom theme colors, logo, favicons, and Tailwind tokens                   |
| SEO              | `useSeo()` + Schema.org on every page, OG images, sitemap                 |

### Prerequisites

Before handing off to the coding agent, ensure:

1. The `reminders` D1 database is provisioned (already present in
   `wrangler.json` — `database_id: d1839b87-deb3-4387-b704-afb8ee217de6`).
2. Doppler is configured:
   ```bash
   doppler setup --project reminders --config dev
   ```
3. Local dependencies are installed:
   ```bash
   pnpm install
   ```
4. Verify the local setup is healthy:
   ```bash
   pnpm run validate
   pnpm run db:migrate
   pnpm --filter web run quality
   ```

### How to invoke the coding agent

#### Option A — GitHub Copilot coding agent (recommended)

1. Open this repository in github.com.
2. Navigate to **Issues → New issue**.
3. Paste the contents of the build prompt (see
   `.agents/workflows/build-reminders-app.md`) into the issue body.
4. Assign the issue to **@github-copilot** (the Copilot coding agent).
5. The agent will open a pull request implementing the full feature set.

> **Tip:** You can also invoke the agent directly from a pull request or via
> the GitHub Copilot chat sidebar in VS Code / GitHub.com by typing the prompt
> directly.

#### Option B — Antigravity / local agent

Open this repository in Antigravity and run:

```
/build-reminders-app
```

This executes the `.agents/workflows/build-reminders-app.md` workflow.

#### Option C — Any compatible coding agent

Copy `.agents/workflows/build-reminders-app.md` and paste it as the system
prompt or first user message in any agent that has file-system access to this
repository (Cursor, Codex, Claude, etc.).

### After the agent finishes

1. Review the pull request diff.
2. Run quality checks locally:
   ```bash
   pnpm --filter web run quality
   ```
3. Smoke-test the local dev server:
   ```bash
   doppler run --config dev -- pnpm run dev
   ```
4. Migrate remote D1 and deploy:
   ```bash
   cd apps/web && pnpm run db:migrate -- --remote
   cd ../..
   pnpm run ship
   ```

---

## 2. Bootstrapping Future Apps from `narduk-nuxt-template`

Use this workflow any time you want to create a brand-new app from the
template.

### Step 1 — Provision the repository

The control plane handles GitHub repo creation, D1 provisioning, Doppler
spoke creation, and the initial deploy in one call:

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

Poll for completion (typically ~5 minutes):

```bash
curl https://control-plane.nard.uk/api/fleet/provision/<provisionId>
# Wait for: { "status": "complete" }
```

Once complete the repository exists at
`https://github.com/narduk-enterprises/<app-name>` and the app serves a
"Coming Soon" page at `https://<app-name>.nard.uk`.

### Step 2 — Clone and install

```bash
git clone https://github.com/narduk-enterprises/<app-name>.git ~/new-code/<app-name>
cd ~/new-code/<app-name>
pnpm install
```

### Step 3 — Verify the baseline

```bash
pnpm run validate
pnpm run db:migrate
pnpm --filter <app-name> run quality
```

All three must pass with zero errors and zero warnings before handing off to
the coding agent.

### Step 4 — Generate the agent build prompt

Run the generate-app-idea workflow (`.agents/workflows/generate-app-idea.md`).
It will:

1. Let you pick or remix an app idea.
2. Generate a full build prompt for the specific idea, including database
   schema, API routes, UI requirements, brand identity brief, and a template
   audit task.
3. Copy the prompt to your clipboard via `pbcopy`.

Alternatively, use `.agents/workflows/new-app-from-template.md` as a
reusable template that you can fill in with your app-specific details.

### Step 5 — Hand off to the coding agent

Use the same three options described in Section 1 (GitHub Copilot coding
agent, Antigravity, or any compatible agent). Paste the generated build prompt
as the agent's task.

### Step 6 — Review, migrate, and deploy

```bash
# After the agent's PR is merged:
cd ~/new-code/<app-name>
git pull
pnpm install

# Remote D1 migration
cd apps/web && pnpm run db:migrate -- --remote
cd ../..

# Deploy
pnpm run ship
```

### Keeping apps up to date

When the template ships improvements (new layer features, security patches,
tooling upgrades), sync them into each downstream app:

```bash
# Full managed sync (tooling + layer)
pnpm run sync-template -- --from ~/new-code/narduk-nuxt-template

# Layer-only sync
pnpm run update-layer -- --from ~/new-code/narduk-nuxt-template
```

---

## Reference Workflows

| Workflow file                                        | Purpose                                              |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `.agents/workflows/build-reminders-app.md`           | Build prompt for this specific reminders app         |
| `.agents/workflows/new-app-from-template.md`         | Reusable build-prompt template for any new app       |
| `.agents/workflows/generate-app-idea.md`             | Brainstorm ideas and auto-generate a build prompt    |
| `.agents/workflows/generate-brand-identity.md`       | Apply full brand identity after the app is built     |
| `.agents/workflows/score-repo.md`                    | Audit and score the repo across 19 architecture categories |
| `.agents/workflows/sync-fleet.md`                    | Roll out template updates across all fleet apps      |

For the full agent handbook, see `docs/agents/README.md`.
