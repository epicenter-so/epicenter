<script lang="ts">
	import { cn } from '#/utils/utils.js';
	import { Tabs as TabsPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null),
		value = $bindable(''),
		...restProps
	}: TabsPrimitive.RootProps = $props();
</script>

<TabsPrimitive.Root
	bind:ref
	bind:value
	data-slot="tabs"
	class={cn('flex flex-col gap-2', className)}
	{...restProps}
/>
