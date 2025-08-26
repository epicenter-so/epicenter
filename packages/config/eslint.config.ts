import globals from 'globals';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import perfectionist from 'eslint-plugin-perfectionist';
import type { Linter } from 'eslint';
import ts from 'typescript-eslint';
import js from '@eslint/js';

/**
 * Base ESLint configuration that includes Prettier integration and ignore patterns.
 * This should be included in all configurations to ensure consistent formatting.
 */
export const base = [
	perfectionist.configs['recommended-natural'],
	{
		rules: {
			'perfectionist/sort-exports': 'off', // Only sort imports, not exports
			'perfectionist/sort-objects': [
				'error',
				{
					type: 'natural',
					order: 'asc',
					groups: ['children', 'title', 'description', 'cause', 'context', 'message', 'unknown'],
					customGroups: [
						{
							groupName: 'children',
							selector: 'property',
							elementNamePattern: '^children$',
						},
						{
							groupName: 'title',
							selector: 'property',
							elementNamePattern: '^title$',
						},
						{
							groupName: 'description',
							selector: 'property',
							elementNamePattern: '^description$',
						},
						{
							groupName: 'cause',
							selector: 'property',
							elementNamePattern: '^cause$',
						},
						{
							groupName: 'context',
							selector: 'property',
							elementNamePattern: '^context$',
						},
						{
							groupName: 'message',
							selector: 'property',
							elementNamePattern: '^message$',
						},
					],
				},
			],
		},
	},
	{
		ignores: [
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
		],
	},
	prettier,
] satisfies Linter.Config[];

/**
 * Complete ESLint configuration for Svelte applications.
 * Includes base config plus Svelte-specific rules and Prettier compatibility.
 */
export const svelteConfig = ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		// See more details at: https://typescript-eslint.io/packages/parser/
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'], // Add support for additional file extensions, such as .svelte
				parser: ts.parser,
			},
		},
	},
);
