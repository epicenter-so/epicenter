import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import perfectionist from 'eslint-plugin-perfectionist';
import type { Linter } from 'eslint';

/**
 * Shared ESLint configuration for Svelte applications in the Whispering monorepo.
 *
 * This config provides Svelte-specific linting rules that complement the root-level
 * Biome configuration. While Biome handles general code quality, this ESLint config
 * adds Svelte-aware linting and additional plugins not available in Biome.
 */

/**
 * Common ignore patterns for build outputs and generated files.
 * These patterns prevent ESLint from checking files that shouldn't be linted.
 */
export const ignorePatterns = [
	// Build outputs
	'**/dist/**',
	'**/build/**',
	'**/.svelte-kit/**',
	'**/source-target/**',
	'**/target/**',
	'**/.turbo/**',

	// Dependencies
	'**/node_modules/**',

	// Generated files
	'**/*.min.js',
	'**/*.min.css',
	'**/generated/**',

	// Test coverage
	'**/coverage/**',

	// IDE and OS files
	'**/.DS_Store',
	'**/.idea/**',
	'**/.vscode/**',

	// Temporary files
	'**/*.log',
	'**/tmp/**',
	'**/temp/**',

	// Package manager files
	'**/pnpm-lock.yaml',
	'**/package-lock.json',
	'**/yarn.lock',
];

/**
 * Base ESLint configuration that includes Prettier integration and ignore patterns.
 * This should be included in all configurations to ensure consistent formatting.
 */
export const base = [
	// prettier,
	// perfectionist.configs['recommended-natural'],
	{
		ignores: ignorePatterns,
	},
] satisfies Linter.Config[];

/**
 * Complete ESLint configuration for Svelte applications.
 * Includes base config plus Svelte-specific rules and Prettier compatibility.
 */
export const svelteConfig = [
	...base,
	...svelte.configs.recommended,
	...svelte.configs.prettier,
	{
		files: ['**/*.svelte', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				// We recommend importing and specifying svelte.config.js.
				// By doing so, some rules in eslint-plugin-svelte will automatically read the configuration and adjust their behavior accordingly.
				// While certain Svelte settings may be statically loaded from svelte.config.js even if you don’t specify it,
				// explicitly specifying it ensures better compatibility and functionality.
				svelte,
			},
		},
	},
] satisfies Linter.Config[];
