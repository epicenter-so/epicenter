<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { transformations } from '$lib/query/transformationRuns';
	import { createQuery } from '@tanstack/svelte-query';
	import { HistoryIcon } from 'lucide-svelte';
	import RenderTransformationRuns from '../transformations/-components/RenderTransformationRuns.svelte';

	let { recordingId }: { recordingId: string } = $props();

	const transformationRunsByRecordingIdQuery = createQuery(
		transformations.getTransformationRunsByRecordingId(() => recordingId)
			.options,
	);

	let isOpen = $state(false);
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
				variant="ghost"
				size="icon"
				tooltipContent="View Transformation Runs"
			>
				<HistoryIcon class="size-4" />
			</WhisperingButton>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-4xl">
		<Dialog.Header>
			<Dialog.Title>Transformation Runs</Dialog.Title>
			<Dialog.Description>
				View all transformation runs for this recording
			</Dialog.Description>
		</Dialog.Header>
		<div class="max-h-[60vh] overflow-y-auto">
			{#if transformationRunsByRecordingIdQuery.isPending}
				<div class="text-muted-foreground text-sm">Loading runs...</div>
			{:else if transformationRunsByRecordingIdQuery.error}
				<div class="text-destructive text-sm">
					{transformationRunsByRecordingIdQuery.error.message}
				</div>
			{:else if transformationRunsByRecordingIdQuery.data}
				<RenderTransformationRuns
					runs={transformationRunsByRecordingIdQuery.data}
				/>
			{/if}
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isOpen = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
