import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/svelte-query';
import { createQueryFactories } from 'wellcrafted/query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			enabled: browser,
		},
	},
});

export const { defineQuery, defineMutation } =
	createQueryFactories(queryClient);
