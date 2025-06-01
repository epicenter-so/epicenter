<script lang="ts">
	import { type WithElementRef, cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<header bind:this={ref} class={cn('space-y-1.5', className)} {...restProps}>
	{@render children?.()}
</header>
