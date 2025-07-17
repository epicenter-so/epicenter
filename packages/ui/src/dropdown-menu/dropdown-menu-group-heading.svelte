<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { cn } from '#/utils/utils.js';
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let {
		class: className,
		inset,
		ref = $bindable(null),
		...restProps
	}: ComponentProps<typeof DropdownMenuPrimitive.GroupHeading> & {
		inset?: boolean;
	} = $props();
</script>

<DropdownMenuPrimitive.GroupHeading
	bind:ref
	data-slot="dropdown-menu-group-heading"
	data-inset={inset}
	class={cn('px-2 py-1.5 text-sm font-semibold data-[inset]:pl-8', className)}
	{...restProps}
/>
