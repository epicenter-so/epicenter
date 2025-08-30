<script lang="ts">
	import type { Snippet } from 'svelte';

	import * as Tooltip from '@repo/ui/tooltip';
	import { mergeProps } from 'bits-ui';

	let {
		id,
		tooltipContent,
		trigger,
		...restProps
	}: {
		id: string;
		tooltipContent: Snippet | string;
		trigger: Snippet<
			[{ tooltip: Snippet<[]>; tooltipProps: Record<string, unknown>; }]
		>;
	} = $props();
</script>

{#snippet tooltip()}
	{#if typeof tooltipContent === 'string'}
		{tooltipContent}
	{:else}
		{@render tooltipContent()}
	{/if}
{/snippet}

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger {id}>
			{#snippet child({ props: tooltipProps })}
				{@render trigger?.({
					tooltip,
					tooltipProps: mergeProps(tooltipProps, restProps),
				})}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content class="max-w-xs text-center">
			{@render tooltip()}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
