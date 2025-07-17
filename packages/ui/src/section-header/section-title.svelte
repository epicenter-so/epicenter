<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn, type WithElementRef } from '#/utils/utils.js';

	let {
		children,
		class: className,
		level = 2,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLHeadingElement>> & {
		level?: 1 | 2 | 3 | 4 | 5 | 6;
	} = $props();
</script>

{#if level === 1}
	<h1
		bind:this={ref}
		class={cn('font-semibold leading-none text-2xl', className)}
		{...restProps}
	>
		{@render children?.()}
	</h1>
{:else if level === 2}
	<h2
		bind:this={ref}
		class={cn('font-semibold leading-none text-lg', className)}
		{...restProps}
	>
		{@render children?.()}
	</h2>
{:else if level === 3}
	<h3
		bind:this={ref}
		class={cn('font-semibold leading-none text-base', className)}
		{...restProps}
	>
		{@render children?.()}
	</h3>
{:else if level === 4}
	<h4
		bind:this={ref}
		class={cn('font-semibold leading-none text-sm', className)}
		{...restProps}
	>
		{@render children?.()}
	</h4>
{:else if level === 5}
	<h5
		bind:this={ref}
		class={cn('font-semibold leading-none text-sm', className)}
		{...restProps}
	>
		{@render children?.()}
	</h5>
{:else if level === 6}
	<h6
		bind:this={ref}
		class={cn('font-semibold leading-none text-xs', className)}
		{...restProps}
	>
		{@render children?.()}
	</h6>
{/if}
