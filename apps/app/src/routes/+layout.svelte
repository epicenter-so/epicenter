<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { queryClient } from '$lib/query';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import '../app.css';
	import AppShell from './+layout/AppShell.svelte';
	import { context } from '$lib/context';
	import { createPressedKeys } from '$lib/utils/createPressedKeys.svelte';

	let { children } = $props();

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	context.pressedKeys.set(createPressedKeys());
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
	<AppShell>
		{@render children()}
	</AppShell>
	<SvelteQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
</QueryClientProvider>
