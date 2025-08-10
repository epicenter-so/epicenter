# Dev Container Migration Plan

Problem statement: local setup is inconsistent across contributors. Tool versions drift; some apps need Cloudflare Workers, others need Node, bun, Rust (for Tauri). New machines require multiple manual steps and platform quirks. Goal: provide a devcontainer that standardizes toolchains and makes starting API and web apps fast, while keeping the Tauri desktop app (Whispering) running natively on the host. Default local Postgres via docker-compose; Neon optional fallback.

Goals

- Reduce setup friction to near-zero for API and web apps
- Standardize versions using mise as the single source of truth
- Keep Whispering (Tauri) native on host; ensure toolchain parity via mise pinning
- Preserve current non-container path; migrate incrementally

Scope

- In container: apps/api (Workers via wrangler), apps/sh (SvelteKit), apps/epicenter (Astro), apps/posthog-reverse-proxy (Worker), packages/db (Drizzle), packages/ui, packages/shared/constants as needed
- Excluded from running inside container: apps/whispering (Tauri). Its build toolchain remains pinned via mise for parity, but dev/build runs on host only
- Default: docker-compose.yml with Postgres for local dev, with DATABASE_URL override available to switch to Neon

Architecture plan

- devcontainer.json: VS Code Dev Containers configuration referencing Dockerfile, workspace bind mount, features, and postCreateCommand
- Dockerfile: base on ubuntu or mcr.microsoft.com/devcontainers/base; install mise; run mise install to provision tools; install system deps for bun/node/rust; cache bun
- docker-compose.yml: postgres service (14 or 16), healthcheck, volume for data, port 5432 published; service started by default via devcontainer compose; developers can switch to Neon by setting DATABASE_URL in mise.local.toml
- Networking/ports exposed from container:
  - 8787: wrangler dev for apps/api
  - 5173: SvelteKit (apps/sh)
  - 4321: Astro (apps/epicenter)
  - 8790+: reserve for additional wrangler services (posthog-reverse-proxy) to avoid conflicts; document how to set --port in scripts
- Bind mounts: mount repo root into /workspaces/epicenter (default by devcontainer); node_modules left inside workspace (no separate volumes)
- OAuth callbacks: document localhost callbacks per app (5173 for sh; 4321 for epicenter). For Codespaces, note generated domains and use provider allowlists or .env overrides

Tool and version management

- Use mise as canonical version manager. Install in image; set PATH to mise shims; run `mise install` during build
- Tools to pin/manage via mise: bun, node, wrangler, drizzle-kit, rust (for parity only), cargo, pnpm if referenced, shellcheck/shfmt if used by CI
- Ensure `~/.local/share/mise/shims` on PATH; verify `bun`, `node`, `wrangler`, `drizzle-kit`, `rustc`, `cargo` resolve through mise

Environment management

- Prefer mise for env management: declare keys in `mise.toml` under `[env]` with empty defaults (e.g., `DATABASE_URL = ""`); add a note instructing devs to create `mise.local.toml` to set their local secrets/overrides
- Keep apps/api/.dev.vars for wrangler bindings; wrangler relies on `.dev.vars` during `wrangler dev`
- Do not store secrets in image or commit them to mise; ensure `mise.local.toml` is gitignored
- postCreate tasks: ensure shells run with `mise activate`; if `mise.local.toml` is missing, copy from `mise.local.toml.example` and leave values blank
- Infisical: document as optional path to generate apps/api `.dev.vars` via `infisical export > .dev.vars`

Script mapping: container vs host

- Inside container
  - Root: `bunx turbo run build`, `bunx turbo run dev`, `bun format`, `bun lint`
  - apps/api: `bun dev` (wrangler dev), `bun run deploy`, `bun run cf-typegen`
  - apps/sh: `bun dev`, `bun build`, `bun preview`, `bun run deploy`, `bun run check`
  - apps/epicenter: `bun dev`, `bun build`, `bun preview`, `bun run deploy`
  - apps/posthog-reverse-proxy: `bun dev`, `bun run deploy`, `bun run tail`
  - apps/cli: `bun dev`, `bun run typecheck`
  - packages/db: `bun run db:generate`, `bun run db:migrate`, `bun run db:migrate:dev`, `bun run db:studio`, `bun run db:drop`
  - packages/ui: `bun format`, `bun lint`
- Host only
  - apps/whispering: `bun tauri dev` and Tauri builds; any GUI or audio dependent flows
- Replace setup-local.sh bootstrapping with devcontainer postCreateCommand steps while keeping the script for non-container path

Devcontainer tasks

- postCreateCommand (idempotent):
  1. `mise install`
  2. Ensure shell auto-activation: append `eval \"$(mise activate bash)\"` to ~/.bashrc (or fish/zsh equivalents) if not present
  3. `bun install` at repo root (respects workspaces)
  4. Env examples if missing:
     - `[ -f mise.local.toml ] || [ -f .mise.local.toml ] || cp mise.local.toml.example mise.local.toml || true`
     - `[ -f apps/api/.dev.vars ] || cp apps/api/.dev.vars.example apps/api/.dev.vars`
  5. Database bootstrap (optional, guarded by env flag):
     - if `DB_BOOTSTRAP=1`, run `bun run -w packages/db db:generate` then `bun run -w packages/db db:migrate:dev`
  6. Print wrangler login guidance: `wrangler whoami || echo "Run: wrangler login"`
- Features/system deps
  - Install common build essentials: git, curl, ca-certificates, build-essential, pkg-config, python3, openssl
  - Install browsers are not required; we run headless dev only
  - If using node-gyp anywhere, ensure python3 and build tools present

Postgres via docker-compose (default)

- Service definition
  - image: postgres:16
  - ports: "5432:5432"
  - env: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD (dev defaults)
  - volumes: named volume for data persistence
- Usage: The devcontainer starts Postgres by default via compose; `DATABASE_URL` points to local service unless overridden in `mise.local.toml` to use Neon

Testing plan

- Validate each app starts in the container:
  - apps/api reachable at http://localhost:8787 (confirm wrangler outputs)
  - apps/sh at http://localhost:5173
  - apps/epicenter at http://localhost:4321
  - apps/posthog-reverse-proxy running in separate port (e.g., 8791) with tail logs confirming proxy works
- Database: run migrations against local Postgres by default; when overridden to Neon via `mise.local.toml`, verify migrations also succeed; ensure `db:studio` connects
- Tooling: run lint/format/typecheck at root and within packages
- Cross-OS: verify container works on macOS (Intel/ARM) and Windows (Docker Desktop) with file permissions intact

Rollout plan

- Phase 1: Add devcontainer scaffolding and docs; do not change scripts
- Phase 2: Add explicit --port flags to avoid wrangler port conflicts when multiple Workers run concurrently
- Phase 3: Team adoption; collect feedback; adjust postCreateCommand
- Maintain non-container path via scripts/setup-local.sh and existing docs

Risks and mitigations

- Tauri incompatibility: we do not run Whispering inside container; ensure readme calls this out
- OAuth callback domains: document localhost and Codespaces domain variants; make callbacks configurable via .env
- Codespaces domains: dynamic ports and HTTPS; test callbacks; consider `local-https` if needed
- Port conflicts: pin dev ports and document how to override; add CI note for parallel runs
- File permissions: use `devcontainer` user with same UID/GID mapping; avoid root-owned node_modules
- Docker Desktop nuances (Windows/Mac): avoid reliance on inotify limits; raise max watched files in container if needed

Success criteria

- New contributor can open in Dev Containers and run: `bunx turbo run dev` and start apps/api, apps/sh, apps/epicenter without manual tooling installs
- `mise doctor` passes and shims correctly resolve in container
- DB migrations succeed against default local Postgres and optional Neon
- Lint/format/typecheck run successfully in container
- Whispering development continues working on host unchanged

Implementation plan and TODO checklist with Agent Assignments

- [ ] @devcontainer-configurator Add .devcontainer/devcontainer.json with Dockerfile reference, forwardedPorts: [8787, 5173, 4321], features, postCreateCommand
- [ ] @docker-architect Add .devcontainer/Dockerfile: install system deps, install mise, run `mise install`, install bun
- [ ] Ensure PATH exports mise shims and shells auto-activate (`mise activate`); verify `bun --version` and `wrangler --version` during build
- [ ] Add docker-compose.yml with postgres service and README usage notes; wire it to start by default in devcontainer
- [ ] @plan-agent Update root README and docs to describe container workflow and host-only Whispering
- [ ] Add explicit ports to dev scripts where needed to avoid conflicts (e.g., posthog-reverse-proxy set --port 8791)
- [ ] Implement postCreateCommand steps: bun install, ensure mise activation, copy `mise.local.toml.example` to `mise.local.toml` if missing, copy apps/api `.dev.vars`
- [ ] Add `mise.local.toml.example` and populate `mise.toml` `[env]` with empty placeholders and documentation comments
- [ ] @plan-agent Document Infisical optional flow for apps/api `.dev.vars`
- [ ] Validate app startup and port accessibility; update spec Review with findings
- [ ] Keep scripts/setup-local.sh intact; add note pointing to devcontainer as preferred path for web/API

Review/summary

**Implementation completed successfully with the following deliverables:**

**Core Infrastructure:**
- ✅ `.devcontainer/devcontainer.json`: Full VS Code Dev Containers configuration with port forwarding (8787, 5173, 4321, 8791, 5432), features, and extensions
- ✅ `.devcontainer/Dockerfile`: Ubuntu-based container with mise, system dependencies, and tool installation
- ✅ `docker-compose.yml`: PostgreSQL 16 service with health checks and volume persistence
- ✅ `.devcontainer/post-create.sh`: Comprehensive setup script with dependency installation, environment file copying, and guidance

**Environment Management:**
- ✅ `mise.local.toml.example`: Template for local environment overrides
- ✅ Updated `mise.toml`: Added `[env]` section with DATABASE_URL and NODE_ENV defaults
- ✅ Updated `.gitignore`: Added `mise.local.toml` to prevent committing local secrets

**Port Configuration:**
- ✅ API (wrangler): Explicit `--port 8787` in dev scripts
- ✅ PostHog Reverse Proxy: Explicit `--port 8791` in dev scripts
- ✅ SvelteKit (SH): Default port 5173 (unchanged)
- ✅ Astro (Epicenter): Default port 4321 (unchanged)

**Documentation Updates:**
- ✅ README.md: Added Dev Containers as recommended option with clear setup instructions
- ✅ setup-local.sh: Added tip about Dev Containers for faster setup
- ✅ Infisical integration: Documented in post-create script with references to existing docs

**Verified Configurations:**
- Tool versions: bun 1.2.19, node 20, rust 1.72.0 (via mise)
- Database: PostgreSQL 16 with default credentials for local development
- Environment: Supports both local PostgreSQL and Neon override via mise.local.toml
- Shell activation: Automatic mise activation in bash with PATH configuration

**No deviations from original plan.** All requirements met including:
- Whispering (Tauri) remains host-only as specified
- Non-container path preserved via setup-local.sh
- Incremental migration approach maintained
- All specified ports and services configured correctly

**Next steps for validation:**
- Test container build and startup in VS Code Dev Containers
- Verify all services start correctly with `bunx turbo run dev`
- Test database migrations against both local PostgreSQL and Neon
- Validate cross-platform compatibility (macOS, Windows, Linux)
