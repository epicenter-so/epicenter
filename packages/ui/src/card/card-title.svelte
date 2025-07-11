<script lang="ts">
	import { type WithElementRef, cn } from '../utils';
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
	data-slot="card-title"
	class={cn('font-semibold leading-none', className)}
	{...restProps}
>
	{@render children?.()}
</div>
