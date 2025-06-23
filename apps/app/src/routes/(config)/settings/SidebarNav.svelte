<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	let {
		items,
	}: {
		items: readonly { href: string; title: string }[];
	} = $props();

	const [send, receive] = crossfade({
		duration: 250,
		easing: cubicInOut,
	});
</script>

<nav
	class="flex gap-2 overflow-auto lg:flex-col lg:gap-1"
	aria-label="Settings navigation"
>
	{#each items as item (item.href)}
		{@const isActive = $page.url.pathname === item.href}

		<Button
			href={item.href}
			variant="ghost"
			class={cn(
				'relative justify-start text-left font-normal transition-colors',
				isActive
					? 'text-sidebar-accent-foreground hover:bg-sidebar-accent/50'
					: 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
			)}
			aria-current={isActive ? 'page' : undefined}
			data-sveltekit-noscroll
		>
			{#if isActive}
				<div
					class="bg-sidebar-accent absolute inset-0 rounded-md"
					in:send={{ key: 'active-sidebar-tab' }}
					out:receive={{ key: 'active-sidebar-tab' }}
				></div>
			{/if}
			<span class="relative z-10">
				{item.title}
			</span>
		</Button>
	{/each}
</nav>
