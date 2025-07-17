<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import {
		cn,
		type WithElementRef,
		type WithoutChildren,
	} from '#/utils/utils.js';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="skeleton"
	class={cn('bg-accent animate-pulse rounded-md', className)}
	{...restProps}
></div>
