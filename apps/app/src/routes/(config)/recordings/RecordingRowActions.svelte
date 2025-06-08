<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import SelectTransformationCombobox from '$lib/components/SelectTransformationCombobox.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import WhisperingTooltip from '$lib/components/WhisperingTooltip.svelte';
	import CopyToClipboardButton from '$lib/components/copyable/CopyToClipboardButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { download } from '$lib/query/download';
	import { recordings } from '$lib/query/recordings';
	import {
		createResultMutation,
		createResultQuery,
	} from '@tanstack/svelte-query';
	import { getTranscriberFromContext } from '$lib/query/singletons/transcriber';
	import { getTransformerFromContext } from '$lib/query/singletons/transformer';
	import type { Recording } from '$lib/services/db';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import { DEBOUNCE_TIME_MS } from '@repo/shared';
	import {
		AlertCircleIcon,
		DownloadIcon,
		EllipsisIcon,
		FileStackIcon,
		Loader2Icon,
		PlayIcon,
		RepeatIcon,
	} from 'lucide-svelte';
	import { nanoid } from 'nanoid/non-secure';
	import EditRecordingDialog from './EditRecordingDialog.svelte';
	import ViewTransformationRunsDialog from './ViewTransformationRunsDialog.svelte';
	import { toast } from '$lib/services/toast';
	import { transformations } from '$lib/query/transformationRuns';

	const transcriber = getTranscriberFromContext();
	const transformer = getTransformerFromContext();
	const deleteRecordingWithToast = createResultMutation(() => ({
		...recordings.deleteRecording(),
		onSuccess: () => {
			toast.success({
				title: 'Deleted recording!',
				description: 'Your recording has been deleted successfully.',
			});
		},
		onError: (error) => {
			toast.error({
				title: 'Failed to delete recording!',
				description: 'Your recording could not be deleted.',
				action: { type: 'more-details', error },
			});
		},
	}));
	const updateRecordingWithToast = createResultMutation(() => ({
		...recordings.updateRecording(),
		onSuccess: () => {
			toast.success({
				title: 'Recording updated!',
				description: 'Your recording has been updated.',
			});
		},
		onError: (error) => {
			toast.error({
				title: 'Failed to update recording!',
				description: 'Your recording could not be updated.',
				action: { type: 'more-details', error },
			});
		},
	}));
	const downloadRecordingWithToast = createResultMutation(
		download.downloadRecordingWithToast(),
	);

	let { recordingId }: { recordingId: string } = $props();

	const latestTransformationRunByRecordingIdQuery = createResultQuery(
		transformations.getLatestTransformationRunByRecordingId(() => recordingId),
	);

	const recordingQuery = createResultQuery(
		recordings.getRecordingById(() => recordingId),
	);

	const recording = $derived(recordingQuery.data);

	let saveTimeout: NodeJS.Timeout;
	function debouncedSetRecording(newRecording: Recording) {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			updateRecordingWithToast.mutate($state.snapshot(newRecording));
		}, DEBOUNCE_TIME_MS);
	}
	$effect(() => {
		return () => clearTimeout(saveTimeout);
	});
</script>

<div class="flex items-center gap-1">
	{#if !recording}
		<Skeleton class="size-8" />
		<Skeleton class="size-8" />
		<Skeleton class="size-8" />
		<Skeleton class="size-8" />
		<Skeleton class="size-8" />
	{:else}
		<WhisperingButton
			tooltipContent={recording.transcriptionStatus === 'UNPROCESSED'
				? 'Start transcribing this recording'
				: recording.transcriptionStatus === 'TRANSCRIBING'
					? 'Currently transcribing...'
					: recording.transcriptionStatus === 'DONE'
						? 'Retry transcription'
						: 'Transcription failed - click to try again'}
			onclick={() =>
				transcriber.transcribeRecording.mutate({
					recording,
					toastId: nanoid(),
				})}
			variant="ghost"
			size="icon"
		>
			{#if recording.transcriptionStatus === 'UNPROCESSED'}
				<PlayIcon class="size-4" />
			{:else if recording.transcriptionStatus === 'TRANSCRIBING'}
				<EllipsisIcon class="size-4" />
			{:else if recording.transcriptionStatus === 'DONE'}
				<RepeatIcon class="size-4 text-green-500" />
			{:else if recording.transcriptionStatus === 'FAILED'}
				<AlertCircleIcon class="size-4 text-red-500" />
			{/if}
		</WhisperingButton>

		<SelectTransformationCombobox
			onSelect={(transformation) =>
				transformer.transformRecording.mutate({
					recordingId: recording.id,
					transformationId: transformation.id,
					toastId: nanoid(),
				})}
		/>

		<EditRecordingDialog
			{recording}
			onChange={(newRecording) => {
				debouncedSetRecording(newRecording);
			}}
		/>

		<CopyToClipboardButton
			label="transcribed text"
			copyableText={recording.transcribedText}
			viewTransitionName={getRecordingTransitionId({
				recordingId,
				propertyName: 'transcribedText',
			})}
		/>

		{#if latestTransformationRunByRecordingIdQuery.isPending}
			<Loader2Icon class="size-4 animate-spin" />
		{:else if latestTransformationRunByRecordingIdQuery.isError}
			<WhisperingTooltip
				id={getRecordingTransitionId({
					recordingId,
					propertyName: 'latestTransformationRunOutput',
				})}
				tooltipContent="Error fetching latest transformation run output"
			>
				{#snippet trigger({ tooltip, tooltipProps })}
					<AlertCircleIcon class="text-red-500" {...tooltipProps} />
					<span class="sr-only">
						{@render tooltip()}
					</span>
				{/snippet}
			</WhisperingTooltip>
		{:else}
			<CopyToClipboardButton
				label="latest transformation run output"
				copyableText={latestTransformationRunByRecordingIdQuery.data?.output ??
					''}
				viewTransitionName={getRecordingTransitionId({
					recordingId,
					propertyName: 'latestTransformationRunOutput',
				})}
			>
				{#snippet copyIcon()}
					<FileStackIcon class="size-4" />
				{/snippet}
			</CopyToClipboardButton>
		{/if}

		<ViewTransformationRunsDialog {recordingId} />

		<WhisperingButton
			tooltipContent="Download recording"
			onclick={() => downloadRecordingWithToast.mutate(recording)}
			variant="ghost"
			size="icon"
		>
			{#if downloadRecordingWithToast.isPending}
				<Loader2Icon class="size-4 animate-spin" />
			{:else}
				<DownloadIcon class="size-4" />
			{/if}
		</WhisperingButton>

		<WhisperingButton
			tooltipContent="Delete recording"
			onclick={() => {
				confirmationDialog.open({
					title: 'Delete recording',
					subtitle: 'Are you sure you want to delete this recording?',
					confirmText: 'Delete',
					onConfirm: () => deleteRecordingWithToast.mutate(recording),
				});
			}}
			variant="ghost"
			size="icon"
		>
			<TrashIcon class="size-4" />
		</WhisperingButton>
	{/if}
</div>
