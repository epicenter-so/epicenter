<script lang="ts">
	import { cn } from '#/utils/utils.js';
	import { Command as CommandPrimitive } from 'bits-ui';

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
