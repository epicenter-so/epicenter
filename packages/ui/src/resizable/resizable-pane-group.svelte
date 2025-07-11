<script lang="ts">
	import { cn } from '../utils';
	import * as ResizablePrimitive from 'paneforge';

	let {
		ref = $bindable(null),
		this: paneGroup = $bindable(),
		class: className,
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
