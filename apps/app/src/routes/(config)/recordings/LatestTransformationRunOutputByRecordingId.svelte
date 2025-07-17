<script lang="ts">
	import CopyableTextareaExpandsToDialog from '$lib/components/copyable/CopyableTextareaExpandsToDialog.svelte';
	import { Skeleton } from '@repo/ui/skeleton';
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
	<CopyableTextareaExpandsToDialog
		{id}
		title="Query Error"
		label="query error"
		text={latestTransformationRunByRecordingIdQuery.error.message}
	/>
{:else if latestTransformationRunByRecordingIdQuery.data?.status === 'failed'}
	<CopyableTextareaExpandsToDialog
		{id}
		title="Transformation Error"
		label="transformation error"
		text={latestTransformationRunByRecordingIdQuery.data.error}
	/>
{:else if latestTransformationRunByRecordingIdQuery.data?.status === 'completed'}
	<CopyableTextareaExpandsToDialog
		{id}
		title="Transformation Output"
		label="transformation output"
		text={latestTransformationRunByRecordingIdQuery.data.output}
	/>
{/if}
