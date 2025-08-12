# Epicenter Development Guide

This guide provides detailed information for developers working on the Epicenter project.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Environment Setup](#environment-setup)
- [Database Management](#database-management)
- [Authentication System](#authentication-system)
- [Working with Apps](#working-with-apps)
- [API Development](#api-development)
- [Deployment](#deployment)
- [Advanced Topics](#advanced-topics)

## Architecture Overview

Epicenter uses a monorepo architecture with shared packages and multiple applications:

```
epicenter/
├── apps/                    # Applications
│   ├── whispering/         # Desktop transcription app
│   ├── sh/                 # Web interface for AI assistants
│   ├── api/                # Backend API server
│   ├── epicenter/          # Main website
│   └── cli/                # Command-line interface
├── packages/               # Shared packages
│   ├── ui/                 # UI component library
│   ├── db/                 # Database layer
│   ├── constants/          # Environment constants
│   └── config/             # Shared configuration
└── docs/                   # Documentation
```

### Technology Stack

- **Frontend**: Svelte 5, SvelteKit 2, Tailwind CSS 4
- **Desktop**: Tauri 2 (Rust + WebView)
- **Backend**: Hono on Cloudflare Workers
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Auth**: Better Auth with GitHub OAuth
- **Deployment**: Cloudflare (Workers & Pages)

### Top-level Dependencies

This project references the following top-level developer tools and platform services that must be installed explicitly on a developer machine or in CI:

- bun (primary package manager / runtime)
- node (fallback runtime; Node.js)
- rust (toolchain for Tauri / desktop builds) — includes cargo
- tauri (desktop application framework / tooling invoked via Rust + bun)
- wrangler (Cloudflare Workers / Pages CLI) — Cloudflare CLI for local dev and deploys
- Cloudflare (Workers, Pages, CDN, KV) — platform services used for deployment
- PostgreSQL (database) — Neon (hosted PostgreSQL) as the recommended provider
- Drizzle ORM / Drizzle Kit (DB migrations & types) — dev tooling invoked via bun scripts
- Infisical CLI (optional) — for team secrets sync

Notes:
- Tools that are delivered/installed via other toolchains are intentionally omitted (e.g., cargo is part of Rust; Turbo/Biome/turborepo CLI are typically installed via bun and so are not listed as separate top-level installs here).
- Frameworks and libraries used by the code (Svelte, Tailwind, tRPC, etc.) are installed as project dependencies via bun and do not require separate system-level installs.
- Versions are hinted in mise.toml and docs (e.g., bun 1.2.19, node 18/20, rust 1.72.0).
## Environment Setup

### Using Dev Containers (Recommended)

Epicenter now supports development using dev containers, which provide a pre-configured environment for all required tools and dependencies. This is the recommended setup for contributors.

#### Prerequisites
- **Docker**: Install Docker Desktop or Docker Engine ([Download](https://www.docker.com/products/docker-desktop/)).
- **VS Code**: Install Visual Studio Code ([Download](https://code.visualstudio.com/)).
- **Dev Containers Extension**: Install the "Dev Containers" extension in VS Code ([Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)).

#### Steps to Get Started
1. Clone the repository:
   ```bash
   git clone https://github.com/epicenter-so/epicenter.git
   cd epicenter
   ```
2. Open the project in VS Code:
   ```bash
   code .
   ```
3. Reopen the project in the dev container:
   - Press `F1` in VS Code.
   - Select "Dev Containers: Reopen in Container".

4. Wait for the container to build and start. This may take a few minutes on the first run.

5. Once the container is ready, you can start development using the pre-installed tools and dependencies.

#### Benefits of Using Dev Containers
- Consistent development environment across all contributors.
- Pre-installed tools like Bun, Rust, PostgreSQL, and more.
- Simplified setup with no need to manually configure environment variables or dependencies.

---

### Understanding Environment Files

The project uses different environment files for different contexts:

1. **`.env`** - Root environment variables (Node.js context)
   - Used by database migrations, auth configuration
   - Read by packages using `@repo/constants/node`

2. **`apps/api/.dev.vars`** - Cloudflare Workers local development
   - Used by Wrangler for local API development
   - Contains the same variables as `.env` but in Cloudflare format

3. **Application-specific configs** - Each app may have additional configs

### Environment Variables Explained

```bash
# NODE_ENV - Controls development/production behavior
NODE_ENV=development  # Controls the runtime environment. Set to "development" for local development or "production" for production builds.

# DATABASE_URL - PostgreSQL connection string
# Format: postgresql://[user]:[password]@[host]/[database]?sslmode=require
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require

# BETTER_AUTH_URL - Where the auth API is hosted
BETTER_AUTH_URL=http://localhost:8787  # Local development
# Production: https://api.epicenter.so

# BETTER_AUTH_SECRET - Secret for signing auth tokens
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-32-character-random-secret

# GitHub OAuth - For authentication
GITHUB_CLIENT_ID=your-github-app-client-id
GITHUB_CLIENT_SECRET=your-github-app-client-secret
```

### Secrets Management

We provide two approaches for managing secrets:

#### Local Development (Default)

Use `.env` files and `.dev.vars` files with your own values. This is the recommended approach for contributors.

#### Infisical (Team Members)

For team members with Infisical access:

```bash
# Install Infisical CLI
curl -sL https://infisical.com/cli-install.sh | sh

# Login and initialize
infisical login
infisical init

# Use Infisical-enabled scripts
bun run --filter @repo/db db:migrate:dev:infisical
```

## Database Management

### Setting Up Neon Database

1. **Create a Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up for a free account
   - Free tier includes 0.5 GB storage

2. **Create a Project**
   - Click "Create Project"
   - Choose a region close to you
   - Keep the default PostgreSQL version

3. **Get Connection String**
   - Go to your project dashboard
   - Click "Connection Details"
   - Copy the connection string
   - Add `?sslmode=require` at the end

### Database Commands

```bash
# Generate TypeScript types from schema
bun run --filter @repo/db db:generate

# Run migrations (development)
bun run --filter @repo/db db:migrate:dev

# Run migrations (production)
bun run --filter @repo/db db:migrate:prod

# Open Drizzle Studio (database GUI)
bun run --filter @repo/db db:studio

# Drop all tables (dangerous!)
bun run --filter @repo/db db:drop
```

### Working with Drizzle ORM

The database schema is defined in `packages/db/src/schema/`. Key files:

- `users.ts` - User authentication schema
- `sessions.ts` - Session management
- `accounts.ts` - OAuth account connections

Example query:

```typescript
import { db } from '@repo/db';
import { users } from '@repo/db/schema';
import { eq } from 'drizzle-orm';

// Find a user by email
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'user@example.com'))
  .limit(1);
```

## Authentication System

### Better Auth Setup

The project uses Better Auth with the following configuration:

- **Provider**: GitHub OAuth
- **Database**: PostgreSQL via Drizzle
- **Session**: Cookie-based

### Setting Up GitHub OAuth

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/applications/new)

2. Create a new OAuth App:
   ```
   Application name: Epicenter Local Dev
   Homepage URL: http://localhost:5173
   Authorization callback URL: http://localhost:8787/api/auth/callback/github
   ```

3. For production:
   ```
   Homepage URL: https://epicenter.sh
   Authorization callback URL: https://api.epicenter.so/api/auth/callback/github
   ```

### Auth Flow

1. User clicks "Sign in with GitHub"
2. Redirected to GitHub for authorization
3. GitHub redirects back with code
4. API exchanges code for tokens
5. User session created in database
6. Cookie set for authentication

## Running All Applications

### Using mise dev-all (Recommended)

The fastest way to start all applications at once:

```bash
# Start all apps simultaneously
mise dev-all

# This starts:
# - API server on http://localhost:8787
# - PostHog Reverse Proxy on http://localhost:8791  
# - SH (SvelteKit) on http://localhost:5173
# - Epicenter (Astro) on http://localhost:4321
```

The `mise dev-all` command uses Turbo to orchestrate multiple development servers with proper port management to avoid conflicts.

### Inspector Port Configuration

To prevent debugging port conflicts when running multiple Cloudflare Workers simultaneously, the project uses different inspector ports:

- **API**: Inspector port 9229
- **PostHog Reverse Proxy**: Inspector port 9230

This configuration is set in the respective `package.json` files and allows both wrangler processes to run without port conflicts.

## Working with Apps

### Whispering (Desktop App)

```bash
# Development
cd apps/whispering
bun dev  # Starts Tauri dev server

# Build
bun tauri build  # Creates platform-specific binaries
```

Key features:
- Voice recording and transcription
- Multiple provider support (OpenAI, Groq, etc.)
- AI-powered text transformations
- Local storage with IndexedDB

### epicenter.sh (Web App)

```bash
# Development
cd apps/sh
bun dev  # Starts SvelteKit dev server on :5173

# Build
bun build  # Creates static site for deployment
```

Key features:
- Connect to OpenCode servers
- Manage AI assistant configurations
- Chat interface with code context
- Session management

### API (Backend)

```bash
# Development
cd apps/api
bun dev  # Starts Wrangler dev server on :8787

# Deploy to Cloudflare
bun deploy
```

Key endpoints:
- `/api/auth/*` - Authentication routes
- `/api/trpc/*` - tRPC API endpoints

## API Development

### Working with Cloudflare Workers

The API runs on Cloudflare Workers with these considerations:

- No Node.js APIs (use Web APIs)
- Edge runtime constraints
- Environment variables via `c.env`
- KV storage for caching (optional)

### Local Development with Wrangler

```bash
# Start local server
cd apps/api
bun dev

# The server runs at http://localhost:8787
# Hot reload is enabled
```

### tRPC Setup

The API uses tRPC for type-safe APIs:

```typescript
// Define a router
export const userRouter = router({
  getUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Implementation
    }),
});

// Use in frontend
import { trpc } from '$lib/trpc';
const user = await trpc.user.getUser.query({ id: '123' });
```

## Deployment

### Development Workflow

1. **Local Development** → `localhost`
2. **Preview Deployments** → Cloudflare preview URLs
3. **Production** → Custom domains

### Deploying the API

```bash
cd apps/api
bun deploy  # Deploys to Cloudflare Workers
```

### Deploying Web Apps

Apps are automatically deployed via GitHub Actions on push to main:

- **epicenter.sh** → Cloudflare Pages
- **Main site** → Cloudflare Pages
- **Whispering** → GitHub Releases (binaries)

### Environment Management

Production environment variables are managed through:
- Cloudflare dashboard for Workers/Pages
- GitHub Secrets for Actions
- Infisical for team synchronization

## Advanced Topics

### Monorepo Management

We use Turborepo for build orchestration:

```bash
# Build all packages in dependency order
turbo run build

# Run specific task with dependencies
turbo run build --filter=@epicenter/api

# Cache is stored in .turbo/
```

### Package Dependencies

Internal packages use workspace protocol:

```json
{
  "dependencies": {
    "@repo/db": "workspace:*",
    "@repo/constants": "workspace:*"
  }
}
```

### Code Generation

Several tools generate code:

- **Drizzle Kit** - Database migrations and types
- **tRPC** - API client types
- **Wrangler** - Cloudflare bindings types

### Performance Optimization

Key optimizations:

1. **Code Splitting** - SvelteKit automatic code splitting
2. **Edge Caching** - Cloudflare CDN for static assets
3. **Database Pooling** - Neon serverless pooling
4. **Lazy Loading** - Dynamic imports for heavy components

### Security Considerations

- **Environment Variables** - Never commit secrets
- **CORS** - Configured per environment
- **CSP** - Content Security Policy headers
- **Auth** - Session validation on every request
- **Input Validation** - Zod schemas for all inputs

## Troubleshooting

### Common Issues and Solutions

**TypeScript errors after schema changes**
```bash
bun run --filter @repo/db db:generate
```

**Authentication not working locally**
- Check `BETTER_AUTH_URL` matches your API URL
- Verify GitHub OAuth callback URL
- Clear cookies and try again

**Database connection timeouts**
- Check if Neon database is active
- Verify `sslmode=require` in connection string
- Try connection pooling endpoint

**Cloudflare deployment fails**
- Check wrangler.jsonc configuration
- Verify all environment variables are set
- Check build output size (<1MB for Workers)

**Multiple wrangler processes failing to start**
- Inspector port conflicts resolved by using different ports (9229, 9230)
- Use `mise dev-all` instead of running services individually
- Kill existing processes if ports are still in use: `lsof -i :9229`

### Debug Mode

Enable detailed logging:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.debug('Detailed debug info', data);
}
```

### Getting Help

- Check existing [GitHub Issues](https://github.com/epicenter-so/epicenter/issues)
- Join our [Discord](https://go.epicenter.so/discord)
- Review [CONTRIBUTING.md](../CONTRIBUTING.md)

## Resources

### Documentation
- [SvelteKit](https://kit.svelte.dev)
- [Tauri](https://tauri.app)
- [Cloudflare Workers](https://developers.cloudflare.com/workers)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better Auth](https://www.better-auth.com)

### Internal Docs
- [CLAUDE.md](../CLAUDE.md) - Coding conventions
- [AGENTS.md](../AGENTS.md) - AI agent configurations
- Architecture specs in `docs/specs/`

---

For quick setup, use `./scripts/setup-local.sh`. For questions, reach out on Discord or open an issue!
