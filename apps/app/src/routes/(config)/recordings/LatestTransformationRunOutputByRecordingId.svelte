<script lang="ts">
	import CopyableTextDialog from '$lib/components/copyable/CopyableTextDialog.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { rpc } from '$lib/query';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import { createQuery } from '@tanstack/svelte-query';

	let {
		recordingId,
	}: {
		recordingId: string;
	} = $props();

	const latestTransformationRunByRecordingIdQuery = createQuery(
		rpc.transformationRuns.getLatestTransformationRunByRecordingId(
			() => recordingId,
		).options,
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
	<CopyableTextDialog
		{id}
		title="Query Error"
		label="query error"
		text={latestTransformationRunByRecordingIdQuery.error.message}
	/>
{:else if latestTransformationRunByRecordingIdQuery.data?.status === 'failed'}
	<CopyableTextDialog
		{id}
		title="Transformation Error"
		label="transformation error"
		text={latestTransformationRunByRecordingIdQuery.data.error}
	/>
{:else if latestTransformationRunByRecordingIdQuery.data?.status === 'completed'}
	<CopyableTextDialog
		{id}
		title="Transformation Output"
		label="transformation output"
		text={latestTransformationRunByRecordingIdQuery.data.output}
	/>
{/if}
