<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { cn } from '#/utils/utils.js';
	import { Select as SelectPrimitive } from 'bits-ui';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: ComponentProps<typeof SelectPrimitive.GroupHeading> = $props();
</script>

<SelectPrimitive.GroupHeading
	bind:ref
	data-slot="select-group-heading"
	class={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
	{...restProps}
>
	{@render children?.()}
</SelectPrimitive.GroupHeading>
