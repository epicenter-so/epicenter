#!/bin/bash
set -e

echo "🚀 Starting post-create setup..."

# Ensure mise is activated in current shell
export PATH="$HOME/.local/share/mise/shims:$PATH"
eval "$(mise activate bash)"

# 1. Ensure shell auto-activation is set up
echo "🐚 Setting up shell activation..."
if ! grep -q 'eval "$(mise activate bash)"' ~/.bashrc; then
    echo 'eval "$(mise activate bash)"' >> ~/.bashrc
fi

# 2. Run mise setup tasks
echo "🛠️  Running setup tasks..."
mise run setup-deps
mise run setup-env
mise run setup-db

# 3. Print wrangler login guidance
echo "🔐 Checking Wrangler authentication..."
if ! wrangler whoami > /dev/null 2>&1; then
    echo "⚠️  Run 'npx wrangler login' to authenticate with Cloudflare"
fi

# 4. Optional Infisical setup for team members
echo ""
echo "🔑 Optional: Infisical setup for team members"
echo "   If you have access to the Infisical project, you can use:"
echo "   • 'bun run dev:infisical' in apps/api to auto-generate .dev.vars"
echo "   • See CONTRIBUTING.md for Infisical setup instructions"

echo "✨ Post-create setup complete!"
echo ""
echo "🎯 Quick start:"
echo "  • Run 'bun run dev:all' to start all development servers"
echo "  • API will be available at http://localhost:8787"
echo "  • SH (SvelteKit) at http://localhost:5173"
echo "  • Epicenter (Astro) at http://localhost:4321"
echo ""
echo "📝 Note: Whispering (Tauri) should be run on the host machine, not in the container"