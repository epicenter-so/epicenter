<script lang="ts">
	import { cn, type WithoutChild } from '#/utils/utils.js';
	import { Accordion as AccordionPrimitive } from 'bits-ui';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChild<AccordionPrimitive.ContentProps> = $props();
</script>

<AccordionPrimitive.Content
	bind:ref
	data-slot="accordion-content"
	class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
	{...restProps}
>
	<div class={cn('pb-4 pt-0', className)}>
		{@render children?.()}
	</div>
</AccordionPrimitive.Content>
