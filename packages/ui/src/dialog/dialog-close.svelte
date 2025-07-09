<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let { ...restProps }: DialogPrimitive.CloseProps = $props();
</script>

<DialogPrimitive.Close data-slot="dialog-close" {...restProps} />
