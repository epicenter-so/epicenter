<script lang="ts">
	import type { HTMLTdAttributes } from 'svelte/elements';

	import { cn, type WithElementRef } from '#/utils/utils.js';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLTdAttributes> = $props();
</script>

<td
	bind:this={ref}
	data-slot="table-cell"
	class={cn(
		'whitespace-nowrap bg-clip-padding p-2 align-middle [&:has([role=checkbox])]:pr-0',
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</td>
