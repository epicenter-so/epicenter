<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';

	import { cn } from '../utils.js';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: CommandPrimitive.ListProps = $props();
</script>

<CommandPrimitive.List
	bind:ref
	data-slot="command-list"
	class={cn(
		'max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden',
		className,
	)}
	{...restProps}
/>
