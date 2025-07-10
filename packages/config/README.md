# @repo/config

Shared configuration files for Svelte applications in the Whispering monorepo.

## Purpose

While the monorepo uses Biome for general TypeScript/JavaScript formatting and linting at the root level, Svelte applications require additional tooling:

- **ESLint**: Provides Svelte-specific linting rules and plugins that Biome doesn't support
- **Prettier**: Handles Svelte component formatting through the prettier-plugin-svelte

This package centralizes these Svelte-specific configurations to ensure consistency across all Svelte projects in the monorepo.

## Installation

```bash
# Install peer dependencies for your Svelte app
pnpm add -D eslint eslint-config-prettier eslint-plugin-svelte prettier prettier-plugin-svelte
```

## ESLint Configuration

```js
// eslint.config.js
import { base, svelteConfig } from '@repo/config/eslint';

export default [...base, ...svelteConfig];
```

## Prettier Configuration

```ts
// prettier.config.ts
import { prettierConfig } from '@repo/config/prettier';

export default prettierConfig;
```