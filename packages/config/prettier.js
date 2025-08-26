/**
 * Shared Prettier configuration for Svelte applications in the Whispering monorepo.
 *
 * This config complements the root-level Biome formatting by providing
 * Svelte-specific formatting rules that Biome doesn't support.
 *
 * @remarks
 * While Biome handles general TypeScript/JavaScript formatting at the root level,
 * Svelte components require specialized formatting through the prettier-plugin-svelte.
 * @type import("prettier").Config
 */
export const prettierConfig = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'all',
	printWidth: 80,
	plugins: ['prettier-plugin-astro', 'prettier-plugin-svelte'],

	overrides: [
		{
			files: '*.svelte',
			options: {
				parser: 'svelte',
			},
		},
		{
			files: '*.astro',
			options: {
				parser: 'astro',
			},
		},
	],
};
