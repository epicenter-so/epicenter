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

## Environment Setup

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
NODE_ENV=development  # or "production"

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