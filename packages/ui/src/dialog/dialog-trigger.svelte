<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let { ...restProps }: DialogPrimitive.TriggerProps = $props();
</script>

<DialogPrimitive.Trigger data-slot="dialog-trigger" {...restProps} />
