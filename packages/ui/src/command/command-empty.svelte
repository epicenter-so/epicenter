<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';

	import { cn } from '../utils.js';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: CommandPrimitive.EmptyProps = $props();
</script>

<CommandPrimitive.Empty
	bind:ref
	data-slot="command-empty"
	class={cn('py-6 text-center text-sm', className)}
	{...restProps}
/>
