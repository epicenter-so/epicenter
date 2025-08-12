# ADR 20250810T153045 — Dev Container Migration

Status: Proposed

Context

Local development setup for the epicenter monorepo is inconsistent across contributors. Different machines require manual installs for toolchains (bun, node, wrangler, rust/cargo for Tauri parity), and apps expect different runtimes (Cloudflare Workers, Node, Astro, SvelteKit, Tauri). This causes onboarding friction, version drift, and platform-specific quirks.

Decision

Adopt a VS Code Dev Container as the recommended, opt-in development environment for API and web apps while keeping the Tauri desktop app (Whispering) running natively on the host. The devcontainer will:

- Provide a reproducible Docker-based image (Ubuntu or Microsoft base image) that installs and uses mise as the canonical version manager and tool provisioning mechanism.
- Run most services and tooling inside the container: apps/api (wrangler dev), apps/sh (SvelteKit), apps/epicenter (Astro), apps/posthog-reverse-proxy, packages/db, packages/ui, packages/shared/constants as needed.
- Exclude apps/whispering (Tauri) from running inside container; Tauri dev/builds remain on the host to preserve native GUI/audio behavior.
- Provide a docker-compose.yml that starts a local PostgreSQL (default) service and exposes standard dev ports (8787, 5173, 4321, etc.). Neon is supported as an override via mise.local.toml and DATABASE_URL.
- Use mise to pin and provide tool versions (bun, node, wrangler, drizzle-kit, rust/cargo for parity), with mise.install executed during devcontainer provisioning and mise activation on shell startup.
- Implement idempotent postCreateCommand steps: mise install, shell auto-activation, bun install, env example copying, optional DB bootstrap, and wrangler guidance.

Consequences

Positive

- New contributors can start the web/API stack with minimal setup: open in Dev Containers and run bunx turbo run dev.
- Toolchain parity across contributors; mise is the single source of truth for versions.
- Reduced platform-specific setup documentation and fewer "works on my machine" issues for web/API work.

Negative / Trade-offs

- Tauri (Whispering) cannot run inside container; contributors doing Tauri work must use the host toolchain. We accept this trade-off to preserve native GUI/audio functionality.
- Devcontainers add maintenance overhead: Dockerfile, devcontainer.json, and postCreate scripts must be kept up to date with mise and project tooling changes.
- Potential differences in filesystem semantics and performance across OS/Docker Desktop; cross-platform validation is required.

Implementation Notes

- Ports: forward 8787 (wrangler), 5173 (SvelteKit), 4321 (Astro), reserve 8790+ for additional Workers (e.g., 8791 for posthog-reverse-proxy). Postgres exposed on 5432 via docker-compose.
- Devcontainer postCreateCommand should be idempotent and include:
  1. `mise install`
  2. Ensure shell auto-activation (`eval "$(mise activate bash)"` or shell equivalents)
  3. `bun install` at repo root
  4. Copy `mise.local.toml.example` to `mise.local.toml` and `apps/api/.dev.vars.example` to `apps/api/.dev.vars` if missing
  5. Optional DB bootstrap when `DB_BOOTSTRAP=1`
  6. Print wrangler login guidance
- mise.toml should include a `[env]` section with placeholders (e.g., DATABASE_URL) and a gitignored `mise.local.toml` for secrets/overrides.
- Keep existing non-container setup (scripts/setup-local.sh) for contributors who prefer host-based setup.

Risks & Mitigations

- Tauri incompatibility: explicitly document Whispering as host-only and keep mise pins for parity.
- OAuth callback domains: document local and Codespaces callback handling and make callbacks configurable via env overrides.
- Port conflicts: add explicit --port flags to dev scripts and document overrides.
- File permission issues: run container with devcontainer user mapped to host UID/GID and avoid root-owned node_modules.

Testing & Success Criteria

- Verify apps start inside container at expected ports and wrangler outputs are reachable.
- `mise doctor` passes and shims resolve inside container.
- DB migrations run successfully against default local Postgres and when DATABASE_URL points to Neon.
- Lint/format/typecheck succeed inside the container.

Alternatives Considered

- Full host-only standardized scripts: rejected due to continued onboarding friction and platform drift.
- Running Tauri inside container: rejected due to GUI/audio and native integration requirements.

Status & Next Steps

- Status: Proposed — implement devcontainer scaffolding and docs in phases: scaffolding, port pinning, team adoption.
- Create `.devcontainer/devcontainer.json`, `.devcontainer/Dockerfile`, `docker-compose.yml`, post-create scripts, mise local examples, and README updates.

References

Source spec: docs/specs/20250810T153045-dev-container-migration.md

Generated: 2025-08-10T15:30:45Z
