<script lang="ts">
	import { cn } from '../utils.js';
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let {
		class: className,
		...restProps
	}: DialogPrimitive.TitleProps = $props();
</script>

<DialogPrimitive.Title
	data-slot="dialog-title"
	class={cn('text-lg font-semibold leading-none', className)}
	{...restProps}
/>
