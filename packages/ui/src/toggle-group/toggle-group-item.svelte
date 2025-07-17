<script lang="ts">
	import { cn } from '#/utils/utils.js';
	import { type ToggleVariants, toggleVariants } from '#toggle/index.js';
	import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';

	import { getToggleGroupCtx } from './toggle-group.svelte';

	let {
		class: className,
		ref = $bindable(null),
		size,
		value = $bindable(),
		variant,
		...restProps
	}: ToggleGroupPrimitive.ItemProps & ToggleVariants = $props();

	const ctx = getToggleGroupCtx();
</script>

<ToggleGroupPrimitive.Item
	bind:ref
	data-slot="toggle-group-item"
	data-variant={ctx.variant || variant}
	data-size={ctx.size || size}
	class={cn(
		toggleVariants({
			size: ctx.size || size,
			variant: ctx.variant || variant,
		}),
		'min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l',
		className,
	)}
	{value}
	{...restProps}
/>
