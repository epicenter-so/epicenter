<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { useTransformationsQuery } from '$lib/query/transformations/queries';
	import type { Transformation } from '$lib/services/db';
	import { LayersIcon } from 'lucide-svelte';
	import WhisperingButton from './WhisperingButton.svelte';
	import { Badge } from './ui/badge';
	import { useCombobox } from './useCombobox.svelte';

	const { transformationsQuery } = useTransformationsQuery();

	const transformations = $derived(transformationsQuery.data ?? []);

	const combobox = useCombobox();

	let {
		class: className,
		onSelect,
	}: {
		class?: string;
		onSelect: (transformation: Transformation) => void;
	} = $props();
</script>

{#snippet renderTransformationIdTitle(transformation: Transformation)}
	<div class="flex items-center gap-2">
		<Badge variant="id" class="shrink-0 max-w-16 truncate">
			{transformation.id}
		</Badge>
		<span class="font-medium truncate">
			{transformation.title}
		</span>
	</div>
{/snippet}

<Popover.Root bind:open={combobox.open}>
	<Popover.Trigger bind:ref={combobox.triggerRef}>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
				class={className}
				tooltipContent="Run a post-processing transformation to run on your recording"
				role="combobox"
				aria-expanded={combobox.open}
				variant="ghost"
				size="icon"
			>
				<LayersIcon class="size-4" />
			</WhisperingButton>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 max-w-xl p-0">
		<Command.Root loop>
			<Command.Input placeholder="Select transcription post-processing..." />
			<Command.Empty>No transformation found.</Command.Empty>
			<Command.Group class="overflow-y-auto max-h-[400px]">
				{#each transformations as transformation (transformation.id)}
					<Command.Item
						value="${transformation.id} - ${transformation.title} - ${transformation.description}"
						onSelect={() => {
							onSelect(transformation);
							combobox.closeAndFocusTrigger();
						}}
						class="flex items-center gap-2 p-2"
					>
						<div class="flex flex-col min-w-0">
							{@render renderTransformationIdTitle(transformation)}
							{#if transformation.description}
								<span class="text-sm text-muted-foreground line-clamp-2">
									{transformation.description}
								</span>
							{/if}
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
			<Command.Item
				value="Manage transformations"
				onSelect={() => {
					goto('/transformations');
					combobox.closeAndFocusTrigger();
				}}
				class="rounded-none p-2 bg-muted/50 text-muted-foreground"
			>
				<LayersIcon class="size-4 mx-2.5" />
				Manage transformations
			</Command.Item>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
