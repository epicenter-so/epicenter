<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		'bg-card text-card-foreground rounded-lg border shadow-xs',
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
