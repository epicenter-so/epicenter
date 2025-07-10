import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';

// Common ignore patterns for all projects
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

// Base configuration for all projects
export const base = [
	prettier,
	{
		ignores: ignorePatterns,
	},
];

// Svelte-specific configuration
export const svelteConfig = [
	...base,
	...svelte.configs['flat/recommended'],
	...svelte.configs['flat/prettier'],
];
