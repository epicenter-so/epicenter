<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';

	import { cn } from '../utils.js';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: AccordionPrimitive.ItemProps = $props();
</script>

<AccordionPrimitive.Item
	bind:ref
	data-slot="accordion-item"
	class={cn('border-b last:border-b-0', className)}
	{...restProps}
/>
