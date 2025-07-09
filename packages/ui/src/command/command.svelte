<script lang="ts">
	import { cn } from '../utils';
	import { Command as CommandPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
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
