<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { rpc } from '$lib/query';
	import { queryClient } from '$lib/query/_client';
	import * as services from '$lib/services';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import '@repo/ui/app.css';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';

	import AppShell from './+layout/AppShell.svelte';

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

	$effect(() => {
		const unlisten = services.localShortcutManager.listen();
		return () => unlisten();
	});

	// Log app started event once on mount
	$effect(() => {
		rpc.analytics.logEvent.execute({ type: 'app_started' });
	});
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
	<AppShell>
		{@render children()}
	</AppShell>
</QueryClientProvider>

<SvelteQueryDevtools client={queryClient} buttonPosition="bottom-left" />