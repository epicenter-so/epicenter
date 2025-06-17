<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import TransformationPicker from './TransformationPicker.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import WhisperingTooltip from '$lib/components/WhisperingTooltip.svelte';
	import CopyToClipboardButton from '$lib/components/copyable/CopyToClipboardButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		deliverTranscribedText,
		deliverTransformedText,
	} from '$lib/deliverTextToUser';
	import { rpc } from '$lib/query';
	import { services } from '$lib/services';
	import type { Recording } from '$lib/services/db';
	import { toast } from '$lib/toast';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import { DEBOUNCE_TIME_MS } from '@repo/shared';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
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

	const transcribeRecording = createMutation(
		rpc.transcription.transcribeRecording.options,
	);

	const transformRecording = createMutation(
		rpc.transformer.transformRecording.options,
	);

	const deleteRecording = createMutation(
		rpc.recordings.deleteRecording.options,
	);

	const updateRecording = createMutation(
		rpc.recordings.updateRecording.options,
	);

	const downloadRecording = createMutation(
		rpc.download.downloadRecording.options,
	);

	let { recordingId }: { recordingId: string } = $props();

	const latestTransformationRunByRecordingIdQuery = createQuery(
		rpc.transformationRuns.getLatestTransformationRunByRecordingId(
			() => recordingId,
		).options,
	);

	const recordingQuery = createQuery(
		rpc.recordings.getRecordingById(() => recordingId).options,
	);

	const recording = $derived(recordingQuery.data);

	let saveTimeout: NodeJS.Timeout;
	function debouncedSetRecording(newRecording: Recording) {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			updateRecording.mutate($state.snapshot(newRecording), {
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
			});
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
			onclick={() => {
				const toastId = nanoid();
				toast.loading({
					id: toastId,
					title: '📋 Transcribing...',
					description: 'Your recording is being transcribed...',
				});
				transcribeRecording.mutate(recording, {
					onError: (error) => {
						if (error.name === 'WhisperingError') {
							toast.error({ id: toastId, ...error });
							return;
						}
						toast.error({
							id: toastId,
							title: '❌ Failed to transcribe recording',
							description: 'Your recording could not be transcribed.',
							action: { type: 'more-details', error: error },
						});
					},
					onSuccess: (transcribedText) => {
						services.sound.playSoundIfEnabled('transcriptionComplete');

						deliverTranscribedText({ text: transcribedText, toastId });
					},
				});
			}}
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

		<TransformationPicker
			onSelect={(transformation) => {
				const toastId = nanoid();
				toast.loading({
					id: toastId,
					title: '🔄 Running transformation...',
					description:
						'Applying your selected transformation to the transcribed text...',
				});
				transformRecording.mutate(
					{
						recordingId: recording.id,
						transformationId: transformation.id,
					},
					{
						onError: (error) => toast.error(error),
						onSuccess: (transformationRun) => {
							if (transformationRun.status === 'failed') {
								toast.error({
									title: '⚠️ Transformation error',
									description: transformationRun.error,
									action: {
										type: 'more-details',
										error: transformationRun.error,
									},
								});
								return;
							}

							services.sound.playSoundIfEnabled('transformationComplete');

							deliverTransformedText({
								text: transformationRun.output,
								toastId,
							});
						},
					},
				);
			}}
		/>

		<EditRecordingDialog
			{recording}
			onChange={(newRecording) => {
				debouncedSetRecording(newRecording);
			}}
		/>

		<CopyToClipboardButton
			contentName="transcribed text"
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
				contentName="latest transformation run output"
				copyableText={latestTransformationRunByRecordingIdQuery.data?.status ===
				'completed'
					? latestTransformationRunByRecordingIdQuery.data.output
					: ''}
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
			onclick={() =>
				downloadRecording.mutate(recording, {
					onError: (error) => {
						if (error.name === 'WhisperingError') {
							toast.error(error);
							return;
						}
						toast.error({
							title: 'Failed to download recording!',
							description: 'Your recording could not be downloaded.',
							action: { type: 'more-details', error },
						});
					},
					onSuccess: () => {
						toast.success({
							title: 'Recording downloaded!',
							description: 'Your recording has been downloaded.',
						});
					},
				})}
			variant="ghost"
			size="icon"
		>
			{#if downloadRecording.isPending}
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
					onConfirm: () =>
						deleteRecording.mutate(recording, {
							onSuccess: () => {
								toast.success({
									title: 'Deleted recording!',
									description: 'Your recording has been deleted.',
								});
							},
							onError: (error) => {
								toast.error({
									title: 'Failed to delete recording!',
									description: 'Your recording could not be deleted.',
									action: { type: 'more-details', error },
								});
							},
						}),
				});
			}}
			variant="ghost"
			size="icon"
		>
			<TrashIcon class="size-4" />
		</WhisperingButton>
	{/if}
</div>
