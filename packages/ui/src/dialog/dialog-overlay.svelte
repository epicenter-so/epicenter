<script lang="ts">
	import { cn } from '../utils.js';
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let {
		class: className,
		...restProps
	}: DialogPrimitive.OverlayProps = $props();
</script>

<DialogPrimitive.Overlay
	data-slot="dialog-overlay"
	class={cn(
		'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
		// Override to z-40 to ensure that alert-dialogs (which are at z-50) are always on top of dialogs
		'z-40',
		className,
	)}
	{...restProps}
/>
