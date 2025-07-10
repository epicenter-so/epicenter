# @repo/eslint-config

Shared ESLint flat configuration for the Whispering monorepo.

## Installation

This package requires the following peer dependencies:

```bash
pnpm add -D eslint eslint-config-prettier eslint-plugin-svelte
```

## Usage

```js
// eslint.config.js
import { base, svelteConfig } from '@repo/eslint-config';

export default [...base, ...svelteConfig];
```

### Customizing the configuration

```js
// eslint.config.js
import { base, svelteConfig, ignorePatterns } from '@repo/eslint-config';

export default [
  ...base,
  ...svelteConfig,
  {
    // Add your custom rules
    rules: {
      'no-console': 'warn',
    },
  },
  {
    // Add custom ignore patterns
    ignores: [
      ...ignorePatterns,
      '**/custom-folder/**',
    ],
  },
];
```

### Using just the base configuration (without Svelte)

```js
// eslint.config.js
import { base } from '@repo/eslint-config';

export default [...base];
```

## Ignored Patterns

The following patterns are ignored by default:

- Build outputs: `dist/`, `build/`, `.svelte-kit/`, `source-target/`, `target/`, `.turbo/`
- Dependencies: `node_modules/`
- Generated files: `*.min.js`, `*.min.css`, `generated/`
- Test coverage: `coverage/`
- IDE and OS files: `.DS_Store`, `.idea/`, `.vscode/`
- Temporary files: `*.log`, `tmp/`, `temp/`
- Package manager files: `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`