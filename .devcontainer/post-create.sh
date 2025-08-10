#!/bin/bash
set -e

echo "🚀 Starting post-create setup..."

# Ensure mise is activated in current shell
export PATH="$HOME/.local/share/mise/shims:$PATH"
eval "$(mise activate bash)"

# 1. Install mise tools (idempotent)
echo "📦 Installing mise tools..."
mise install

# 2. Ensure shell auto-activation is set up
echo "🐚 Setting up shell activation..."
if ! grep -q 'eval "$(mise activate bash)"' ~/.bashrc; then
    echo 'eval "$(mise activate bash)"' >> ~/.bashrc
fi

# 3. Install dependencies
echo "📥 Installing dependencies..."
bun install

# 4. Copy environment examples if missing
echo "⚙️  Setting up environment files..."

# Copy mise.local.toml.example if it doesn't exist
if [ ! -f mise.local.toml ] && [ -f mise.local.toml.example ]; then
    cp mise.local.toml.example mise.local.toml
    echo "✅ Copied mise.local.toml.example to mise.local.toml"
fi

# Copy .dev.vars example for API
if [ ! -f apps/api/.dev.vars ] && [ -f apps/api/.dev.vars.example ]; then
    cp apps/api/.dev.vars.example apps/api/.dev.vars
    echo "✅ Copied apps/api/.dev.vars.example to apps/api/.dev.vars"
fi

# 5. Optional database bootstrap
if [ "$DB_BOOTSTRAP" = "1" ]; then
    echo "🗄️  Bootstrapping database..."
    bun run -w packages/db db:generate
    bun run -w packages/db db:migrate:dev
    echo "✅ Database bootstrapped"
fi

# 6. Print wrangler login guidance
echo "🔐 Checking Wrangler authentication..."
if ! wrangler whoami > /dev/null 2>&1; then
    echo "⚠️  Run 'wrangler login' to authenticate with Cloudflare"
fi

# 7. Optional Infisical setup for team members
echo ""
echo "🔑 Optional: Infisical setup for team members"
echo "   If you have access to the Infisical project, you can use:"
echo "   • 'bun run dev:infisical' in apps/api to auto-generate .dev.vars"
echo "   • See CONTRIBUTING.md for Infisical setup instructions"

echo "✨ Post-create setup complete!"
echo ""
echo "🎯 Quick start:"
echo "  • Run 'bunx turbo run dev' to start all development servers"
echo "  • API will be available at http://localhost:8787"
echo "  • SH (SvelteKit) at http://localhost:5173"
echo "  • Epicenter (Astro) at http://localhost:4321"
echo ""
echo "📝 Note: Whispering (Tauri) should be run on the host machine, not in the container"