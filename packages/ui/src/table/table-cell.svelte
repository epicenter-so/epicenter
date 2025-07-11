<script lang="ts">
	import { type WithElementRef, cn } from '../utils';
	import type { HTMLTdAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTdAttributes> = $props();
</script>

<td
	bind:this={ref}
	data-slot="table-cell"
	class={cn(
		'whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0',
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</td>
