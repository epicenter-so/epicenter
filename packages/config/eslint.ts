import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';

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
	prettier,
	{
		ignores: ignorePatterns,
	},
];

/**
 * Complete ESLint configuration for Svelte applications.
 * Includes base config plus Svelte-specific rules and Prettier compatibility.
 */
export const svelteConfig = [
	...base,
	...svelte.configs['flat/recommended'],
	...svelte.configs['flat/prettier'],
];
