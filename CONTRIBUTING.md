# Contributing to Epicenter

Thank you for your interest in contributing to Epicenter! We're building an ecosystem of open-source, local-first apps where you own your data and choose your models.

## 🚀 Quick Start (Using Dev Containers)

The easiest way to get started with Epicenter is by using dev containers. This setup ensures a consistent development environment with all required tools pre-installed.

### Prerequisites
- **Docker**: Install Docker Desktop or Docker Engine ([Download](https://www.docker.com/products/docker-desktop/)).
- **VS Code**: Install Visual Studio Code ([Download](https://code.visualstudio.com/)).
- **Dev Containers Extension**: Install the "Dev Containers" extension in VS Code ([Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)).

### Steps to Get Started
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

---

## 🚀 Quick Start (Without Infisical)

New contributors can get started without any special access or tools:

```bash
# 1. Clone the repository
git clone https://github.com/epicenter-so/epicenter.git
cd epicenter

# 2. Run the setup script
./scripts/setup-local.sh

# 3. Configure environment variables
# Edit .env and apps/api/.dev.vars with your values
# Ensure NODE_ENV is set to "development" for local development or "production" for production builds.

# 4. Start development
mise dev-all  # Starts all apps simultaneously
```

## 📋 Prerequisites

### Required
- **Node.js 18+**: [Download](https://nodejs.org)
- **Bun**: Install with `curl -fsSL https://bun.sh/install | bash`
- **PostgreSQL**: We use [Neon](https://neon.tech) (free tier available)
- **GitHub OAuth App**: For authentication

### Optional
- **Rust**: Only needed for Whispering desktop app development
- **Infisical CLI**: Only for team members with access to secrets

## 🔧 Development Setup

### Step 1: Install Dependencies

```bash
# Install Bun if you haven't already
curl -fsSL https://bun.sh/install | bash

# Install project dependencies
bun install
```

### Step 2: Set Up Environment Variables

We provide two approaches for managing environment variables:

#### Option A: Local Development (Recommended for Contributors)

1. Copy the example files:
```bash
cp .env.example .env
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

2. Edit the files with your values (see "Setting Up Services" below)

#### Option B: Using Infisical (Team Members Only)

If you have access to the Infisical project:
```bash
# Install Infisical CLI
curl -sL https://infisical.com/cli-install.sh | sh

# Login and select the project
infisical login
infisical init

# Use the :infisical scripts
bun run --filter @repo/db db:generate:infisical
```

### Step 3: Set Up External Services

#### Neon Database (Free)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL` in your `.env`

#### GitHub OAuth App

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/applications/new)
2. Create a new OAuth App:
   - **Application name**: Epicenter Local Dev
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:8787/api/auth/callback/github`
3. Copy the Client ID and Client Secret to your environment files

### Step 4: Database Setup

```bash
# Generate database schema
bun run --filter @repo/db db:generate

# Run migrations
bun run --filter @repo/db db:migrate:dev

# (Optional) Open Drizzle Studio to view your database
bun run --filter @repo/db db:studio
```

### Step 5: Start Development

```bash
# Start all applications (recommended)
mise dev-all  # Starts API, PostHog proxy, SH, and Epicenter apps

# Alternative: Start all applications using Turbo
bun dev

# Or start specific apps individually
bun run --filter whispering dev  # Whispering desktop app
bun run --filter @epicenter/api dev  # API server
bun run --filter sh dev  # epicenter.sh web app
```

## 🏗️ Project Structure

Epicenter is a monorepo with multiple apps and shared packages:

```
epicenter/
├── apps/
│   ├── whispering/      # Desktop transcription app (Tauri + Svelte 5)
│   ├── sh/              # Web interface for AI assistants (SvelteKit)
│   ├── api/             # Backend API (Hono on Cloudflare Workers)
│   ├── epicenter/       # Main website (Astro)
│   └── cli/             # Command-line interface
├── packages/
│   ├── ui/              # Shared UI components (shadcn-svelte)
│   ├── db/              # Database layer (Drizzle ORM)
│   ├── constants/       # Environment constants and validation
│   └── config/          # Shared configuration
└── docs/                # Documentation
```

## 💻 Development Workflow

### Running Commands

We use Bun workspaces with Turborepo. To run commands for specific packages:

```bash
# Run command for specific package
bun run --filter <package-name> <command>

# Examples
bun run --filter @repo/db db:studio
bun run --filter whispering dev
bun run --filter @epicenter/api deploy
```

### Code Style

Please review [CLAUDE.md](./CLAUDE.md) for our coding conventions:

- Use `type` instead of `interface` in TypeScript
- Prefer `createMutation` from TanStack Query in Svelte files
- Follow the self-contained component pattern
- Use absolute imports when moving components

### Testing

Run tests before submitting PRs:

```bash
# Lint and format all code
bun run format-and-lint

# Type checking (per app)
bun run --filter <app> typecheck
```

## 🔄 Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow existing code patterns
- Update tests if applicable
- Add documentation for new features

### 3. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(whispering): add voice activity detection"
git commit -m "fix(api): resolve authentication error"
git commit -m "docs: update setup instructions"
```

### 4. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a PR on GitHub with:
- Clear description of changes
- Link to related issues
- Screenshots/videos for UI changes

## 🎯 Good First Issues

Looking for where to start? Check out:

- Issues labeled [`good first issue`](https://github.com/epicenter-so/epicenter/labels/good%20first%20issue)
- UI/UX improvements
- Documentation improvements
- New transcription service adapters for Whispering
- Performance optimizations

## 🛠️ Troubleshooting

### Common Issues

**Bun command not found**
```bash
# Reload your shell configuration
source ~/.bashrc  # or ~/.zshrc
```

**Database connection errors**
- Verify your `DATABASE_URL` is correct
- Check if your Neon database is active
- Ensure SSL mode is set: `?sslmode=require`

**Port already in use**
```bash
# Find and kill the process using the port
lsof -i :8787  # API server
lsof -i :5173  # SH (SvelteKit)
lsof -i :4321  # Epicenter (Astro)
lsof -i :8791  # PostHog Reverse Proxy
lsof -i :9229  # API inspector port
lsof -i :9230  # PostHog inspector port
kill -9 <PID>
```

**Multiple wrangler processes failing**
- Use `mise dev-all` instead of starting services individually
- Inspector port conflicts have been resolved with different ports (9229, 9230)

**Missing environment variables**
- Double-check `.env` and `.dev.vars` files
- Ensure no typos in variable names
- Restart the dev server after changes

### Getting Help

- 💬 [Join our Discord](https://go.epicenter.so/discord)
- 📝 [Open an issue](https://github.com/epicenter-so/epicenter/issues)
- 📧 Email: [github@bradenwong.com](mailto:github@bradenwong.com)

## 📚 Additional Resources

- [Development Guide](./docs/DEVELOPMENT.md) - Detailed setup and architecture
- [CLAUDE.md](./CLAUDE.md) - Coding conventions and patterns
- [Architecture Overview](./docs/ARCHITECTURE.md) - System design and patterns

## 📄 License

By contributing to Epicenter, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---

Thank you for contributing to Epicenter! We're excited to build the future of local-first software together. 🚀