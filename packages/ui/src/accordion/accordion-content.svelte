<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';

	import { cn, type WithoutChild } from '../utils';

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
	class={cn(
		'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm',
		className,
	)}
	{...restProps}
>
	<div class="pb-4 pt-0">
		{@render children?.()}
	</div>
</AccordionPrimitive.Content>
