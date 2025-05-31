<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
	bind:this={ref}
	class={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)}
	{...restProps}
>
	{@render children?.()}
</span>
