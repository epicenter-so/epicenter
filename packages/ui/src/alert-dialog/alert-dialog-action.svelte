<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';

	import { buttonVariants } from '../button/index.js';
	import { cn } from '@/utils.js';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: AlertDialogPrimitive.ActionProps = $props();
</script>

<AlertDialogPrimitive.Action
	bind:ref
	data-slot="alert-dialog-action"
	class={cn(buttonVariants(), className)}
	{...restProps}
/>
