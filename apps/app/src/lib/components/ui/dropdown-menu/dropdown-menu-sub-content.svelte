<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DropdownMenuPrimitive.SubContentProps = $props();
</script>

<DropdownMenuPrimitive.SubContent
	bind:ref
	class={cn(
		'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-1 shadow-lg focus:outline-hidden',
		className,
	)}
	{...restProps}
/>
