<script lang="ts">
	import { cn } from '../utils';
	import { Select as SelectPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: SelectPrimitive.GroupHeadingProps = $props();
</script>

<SelectPrimitive.GroupHeading
	bind:ref
	class={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
	{...restProps}
/>
