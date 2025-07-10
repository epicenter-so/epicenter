<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	import { cn } from '../utils.js';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: DialogPrimitive.TitleProps = $props();
</script>

<DialogPrimitive.Title
	bind:ref
	data-slot="dialog-title"
	class={cn('text-lg font-semibold leading-none', className)}
	{...restProps}
/>
