<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';

	import { cn } from '@/utils.js';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: CommandPrimitive.SeparatorProps = $props();
</script>

<CommandPrimitive.Separator
	bind:ref
	data-slot="command-separator"
	class={cn('bg-border -mx-1 h-px', className)}
	{...restProps}
/>
