<script lang="ts">
	import { cn } from '../utils.js';
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let {
		class: className,
		...restProps
	}: DialogPrimitive.DescriptionProps = $props();
</script>

<DialogPrimitive.Description
	data-slot="dialog-description"
	class={cn('text-muted-foreground text-sm', className)}
	{...restProps}
/>
