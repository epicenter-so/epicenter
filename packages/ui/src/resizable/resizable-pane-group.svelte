<script lang="ts">
	import { cn } from '#/utils/utils.js';
	import * as ResizablePrimitive from 'paneforge';

	let {
		class: className,
		ref = $bindable(null),
		this: paneGroup = $bindable(),
		...restProps
	}: ResizablePrimitive.PaneGroupProps & {
		this?: ResizablePrimitive.PaneGroup;
	} = $props();
</script>

<ResizablePrimitive.PaneGroup
	bind:this={paneGroup}
	data-slot="resizable-pane-group"
	class={cn(
		'flex h-full w-full data-[direction=vertical]:flex-col',
		'gap-2',
		className,
	)}
	{...restProps}
/>
