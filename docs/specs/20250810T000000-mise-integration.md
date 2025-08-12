# Mise integration (updated for this repo)

Date: 2025-08-10

## Problem statement

The monorepo mixes tool/version hints and ad-hoc scripts across many subprojects (apps/, cli/, packages/, scripts/). Developers must reason about Bun vs Node, turbo, Rust/Tauri for the desktop app, wrangler for Pages deploys, and multiple per-app envs and setup scripts. This increases onboarding time and causes environment/version drift.

We want a single source of truth for local developer tool versions and common tasks while leaving CI workflows unchanged.

## Goals

- Provide a repo-root mise.toml that pins the tools used during local development and exposes commonly used tasks.
- Keep local secrets out of the repo via mise.local.toml (gitignored) and provide an example template developers can copy.
- Organize larger scripts under mise/tasks/ for maintainability (setup, bootstrap, db migrations, desktop builds).
- Use Mise for local development only; do not make CI depend on Mise.

## Findings in this repository

- packageManager in root package.json is bun@1.2.19 — bun is the primary package manager for local development.
- Turbo is used for monorepo orchestration (turbo ^2.x in package.json & scripts).
- Biome, Wrangler, and other CLIs appear in dev tooling and workflows.
- The Whispering desktop app (Tauri) requires Rust (src-tauri/Cargo.toml present). CI installs Rust for desktop builds.
- There is no .nvmrc; the repo currently relies on bun and explicit tooling in CI/workflows.
- Helper scripts exist under scripts/ (e.g., scripts/setup-local.sh, scripts/dev-no-rust.sh).

If some values are out of date for your team, adjust the pinned versions in mise.toml accordingly.

## Proposed solution

1. Add a repo-root mise.toml that pins the tools used for local dev and exposes tasks that map to existing scripts (so we don't change package.json or CI).
2. Add mise.local.toml.example (developers copy to mise.local.toml and fill secrets). Add /mise.local.toml to .gitignore.
3. Create mise/tasks/ with small, focused shell scripts for larger flows:
   - setup.sh — install deps, run scripts/setup-local.sh
   - bootstrap.sh — workspace bootstrap steps
   - migrate-db.sh — run DB migrations (placeholder; adapt to migration tool)
   - desktop-build.sh — build the Whispering/Tauri desktop app
4. Document usage in docs/DEVELOPMENT.md: how to install Mise, copy local env, and run mise run setup/dev/desktop:build.
5. Keep CI unchanged: CI workflows continue to install Rust, Bun, Node as they do today.

## Recommended mise.toml (create at repo root)

```toml
# mise.toml - pinned to repo needs (create at repo root)
[tools]
bun = "1.2.19"
node = "18.16.0"     # fallback for Node-only tools; adjust if you prefer another version
rust = "1.72.0"     # optional for web-only dev; required for Tauri builds

[tasks.tools]
turbo = { manager = "bun", package = "turbo", version = "^2.3.3" }
biome = { manager = "bun", package = "@biomejs/biome", version = "^1.9.4" }
wrangler = { manager = "bun", package = "wrangler", version = "^4.25.0" }

[env]
NODE_ENV = "development"
DEV_HOST = "http://localhost:5173"

[tasks]
build = "bun run build"
dev = "bun run dev"
format = "bun run format"
lint = "bun run lint"
format-and-lint = "bun run format-and-lint"
setup = "bash mise/tasks/setup.sh"
bootstrap = "bash mise/tasks/bootstrap.sh"
desktop:build = "bash mise/tasks/desktop-build.sh"
migrate-db = "bash mise/tasks/migrate-db.sh"
```

Notes:

- Tasks call existing package.json scripts via bun run to avoid changing current scripts.
- mise.tasks.tools instructs Mise how to install/ensure CLI availability locally.

## Local-only secrets: mise.local.toml (example)

Create a template file named mise.local.toml.example that developers can copy to mise.local.toml and fill with secrets. Do not commit mise.local.toml.

Example content (mise.local.toml.example):

```toml
# mise.local.toml - example for local-only secrets (DO NOT COMMIT)
[env]
OPENAI_API_KEY = "sk-xxxxxxxxxxxxxxxx"
POSTHOG_API_KEY = "phc_XXXXXXXXXXXXX"
DATABASE_URL = "postgres://user:password@localhost:5432/epicenter_local"
TAURI_PRIVATE_KEY = ""
```

Add to .gitignore (root):

```
# Mise local secrets
/mise.local.toml
```

## mise/tasks layout and example scripts

Create mise/tasks/ with small shell scripts. Make them executable (chmod +x).

Suggested layout:

```
mise/tasks/
├── setup.sh
├── bootstrap.sh
├── migrate-db.sh
└── desktop-build.sh
```

Example setup.sh (calls existing scripts/setup-local.sh and bun install):

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Running repo setup from $ROOT"

if ! command -v bun >/dev/null 2>&1; then
  echo "bun not found in PATH. Please install bun or run via mise."
  exit 1
fi

echo "Installing root and workspace deps with bun..."
bun install

if [ -f "$ROOT/scripts/setup-local.sh" ]; then
  echo "Running repository setup-local.sh"
  bash "$ROOT/scripts/setup-local.sh"
else
  echo "No scripts/setup-local.sh found; skipping"
fi

# Optional minimal turbo run - guard it so setup script doesn't fail if not needed
if command -v bun >/dev/null 2>&1 && bun -v >/dev/null 2>&1; then
  echo "Running turbo to ensure workspace linking (non-fatal)"
  bun run turbo run build || true
fi

echo "Setup complete. If you need to build desktop app, run: mise run desktop:build"
```

Provide similar scripts for bootstrap.sh, migrate-db.sh (placeholder to call your migration tool), and desktop-build.sh (builds apps/whispering via bun/npm then runs cargo build in src-tauri).

## Backward compatibility & CI

- Mise is for local development only. Do not change GitHub Actions or other CI to depend on Mise. CI already installs Rust and other toolchains explicitly for desktop builds.
- Because tasks call existing package.json scripts (bun run ...), existing workflows and developer habits continue to work even if Mise is not used.
- Document the change in docs/DEVELOPMENT.md and notify the team that Mise is the recommended local workflow.

## Implementation checklist

- [ ] Add mise.toml to repo root (use recommended content above)
- [ ] Add mise.local.toml.example and instruct developers to copy to mise.local.toml
- [ ] Add `/mise.local.toml` to .gitignore
- [ ] Add mise/tasks/ with setup.sh, bootstrap.sh, migrate-db.sh, desktop-build.sh and mark executable
- [ ] Add usage docs to docs/DEVELOPMENT.md (Mise quickstart snippet)
- [ ] Communicate to the team that Mise is local-only and CI remains unchanged
- [ ] Validate across macOS/Linux/WSL locally: install Mise, run mise run setup, then mise run dev

## Notes and suggestions

- Node version chosen (18.16.0) is a suggested fallback since bun is primary here; change if your team prefers Node 20.
- Rust pinned to 1.72.0 as recommended by prior docs; adjust if your desktop build requires a different toolchain.
- The migrate-db.sh script is a placeholder — replace with your project's migration commands (drizzle/prisma/etc.).

## Summary

This update provides a concrete, repo-specific Mise integration plan: a pinned mise.toml, a local-only env template, organized task scripts under mise/tasks, and a minimal migration path that preserves CI and existing scripts. Mise becomes the canonical way for local development tooling and tasks while leaving CI stable and explicit.
