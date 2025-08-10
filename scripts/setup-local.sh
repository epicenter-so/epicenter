#!/bin/bash

# Epicenter Local Development Setup Script
# This script helps new contributors set up their local development environment

set -e

echo "======================================"
echo "🚀 Epicenter Local Development Setup"
echo "======================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 18+ from https://nodejs.org"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js installed: $NODE_VERSION"
fi

# Check for Bun
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed"
    echo "   Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    echo "✅ Bun installed successfully"
    echo "   Please restart your terminal or run: source ~/.bashrc"
else
    BUN_VERSION=$(bun -v)
    echo "✅ Bun installed: $BUN_VERSION"
fi

# Check for Rust (optional, only needed for Whispering)
if ! command -v rustc &> /dev/null; then
    echo "⚠️  Rust is not installed (optional, needed for Whispering desktop app)"
    echo "   To install: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
else
    RUST_VERSION=$(rustc --version)
    echo "✅ Rust installed: $RUST_VERSION"
fi

echo ""
echo "📁 Setting up environment files..."
echo ""

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
        echo "   ⚠️  Please edit .env and add your configuration values"
    else
        echo "⚠️  .env.example not found, skipping .env creation"
    fi
else
    echo "✅ .env already exists"
fi

# Create .dev.vars for API if it doesn't exist
if [ ! -f apps/api/.dev.vars ]; then
    if [ -f apps/api/.dev.vars.example ]; then
        cp apps/api/.dev.vars.example apps/api/.dev.vars
        echo "✅ Created apps/api/.dev.vars from .dev.vars.example"
        echo "   ⚠️  Please edit apps/api/.dev.vars and add your configuration values"
    else
        echo "⚠️  apps/api/.dev.vars.example not found, skipping .dev.vars creation"
    fi
else
    echo "✅ apps/api/.dev.vars already exists"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install dependencies
bun install

echo ""
echo "======================================"
echo "✨ Setup Complete!"
echo "======================================"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Configure your environment variables:"
echo "   - Edit .env with your database and OAuth credentials"
echo "   - Edit apps/api/.dev.vars for Cloudflare Workers development"
echo ""
echo "2. Set up external services:"
echo "   - Create a free Neon database at https://neon.tech"
echo "   - Create a GitHub OAuth App at https://github.com/settings/applications/new"
echo "     • Homepage URL: http://localhost:5173"
echo "     • Callback URL: http://localhost:8787/api/auth/callback/github"
echo ""
echo "3. Run database migrations:"
echo "   bun run --filter @repo/db db:generate"
echo "   bun run --filter @repo/db db:migrate:dev"
echo ""
echo "4. Start development:"
echo "   bun dev                    # Start all apps"
echo "   bun run --filter app dev  # Start specific app"
echo ""
echo "📚 For more information, see:"
echo "   - CONTRIBUTING.md for contribution guidelines"
echo "   - docs/DEVELOPMENT.md for detailed setup instructions"
echo ""
echo "Happy coding! 🎉"