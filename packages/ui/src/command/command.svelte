<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';

	import { cn } from '@/utils.js';

	let {
		class: className,
		ref = $bindable(null),
		value = $bindable(''),
		...restProps
	}: CommandPrimitive.RootProps = $props();
</script>

<CommandPrimitive.Root
	bind:value
	bind:ref
	data-slot="command"
	class={cn(
		'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
		className,
	)}
	{...restProps}
/>
