<script lang="ts">
	import { cn, type WithoutChild } from '#/utils/utils.js';
	import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui';

	let {
		children,
		class: className,
		orientation = 'vertical',
		ref = $bindable(null),
		...restProps
	}: WithoutChild<ScrollAreaPrimitive.ScrollbarProps> = $props();
</script>

<ScrollAreaPrimitive.Scrollbar
	bind:ref
	data-slot="scroll-area-scrollbar"
	{orientation}
	class={cn(
		'flex touch-none select-none p-px transition-colors',
		orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
		orientation === 'horizontal' &&
			'h-2.5 flex-col border-t border-t-transparent',
		className,
	)}
	{...restProps}
>
	{@render children?.()}
	<ScrollAreaPrimitive.Thumb
		data-slot="scroll-area-thumb"
		class="bg-border relative flex-1 rounded-full"
	/>
</ScrollAreaPrimitive.Scrollbar>
