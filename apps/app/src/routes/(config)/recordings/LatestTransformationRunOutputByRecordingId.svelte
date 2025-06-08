<script lang="ts">
	import CopyableTextDialog from '$lib/components/copyable/CopyableTextDialog.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { transformations } from '$lib/query/transformationRuns';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import { createResultQuery } from '@tanstack/svelte-query';

	let {
		recordingId,
	}: {
		recordingId: string;
	} = $props();

	const latestTransformationRunByRecordingIdQuery = createResultQuery(
		transformations.getLatestTransformationRunByRecordingId(() => recordingId),
	);

	const id = getRecordingTransitionId({
		recordingId,
		propertyName: 'latestTransformationRunOutput',
	});
</script>

{#if latestTransformationRunByRecordingIdQuery.isPending}
	<div class="space-y-2">
		<Skeleton class="h-3" />
		<Skeleton class="h-3" />
		<Skeleton class="h-3" />
	</div>
{:else if latestTransformationRunByRecordingIdQuery.error}
	<div class="text-destructive text-sm">
		{latestTransformationRunByRecordingIdQuery.error.message}
	</div>
{:else if latestTransformationRunByRecordingIdQuery.data?.output}
	<CopyableTextDialog
		{id}
		label="Latest Transformation Run Output"
		text={latestTransformationRunByRecordingIdQuery.data.output}
	/>
{/if}
