<script lang="ts">
	import type { Separator as SeparatorPrimitive } from 'bits-ui';

	import { cn } from '#/utils/utils.js';
	import { Separator } from '#separator/index.js';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: SeparatorPrimitive.RootProps = $props();
</script>

<Separator
	bind:ref
	data-slot="select-separator"
	class={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
	{...restProps}
/>
