<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import CopyToClipboardButton from '$lib/components/copyable/CopyToClipboardButton.svelte';
	import { ClipboardIcon, TrashIcon } from '$lib/components/icons';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import WhisperingTooltip from '$lib/components/WhisperingTooltip.svelte';
	import { rpc } from '$lib/query';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import {
		AlertCircleIcon,
		DownloadIcon,
		EllipsisIcon,
		FileStackIcon,
		Loader2Icon,
		PlayIcon,
		RepeatIcon,
	} from '@lucide/svelte';
	import { Skeleton } from '@repo/ui/skeleton';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { nanoid } from 'nanoid/non-secure';

	import EditRecordingModal from './EditRecordingModal.svelte';
	import TransformationPicker from './TransformationPicker.svelte';
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
				rpc.notify.loading.execute({
					title: '📋 Transcribing...',
					description: 'Your recording is being transcribed...',
					id: toastId,
				});
				transcribeRecording.mutate(recording, {
					onError: (error) => {
						if (error.name === 'WhisperingError') {
							rpc.notify.error.execute({ id: toastId, ...error });
							return;
						}
						rpc.notify.error.execute({
							title: '❌ Failed to transcribe recording',
							description: 'Your recording could not be transcribed.',
							action: { error: error, type: 'more-details' },
							id: toastId,
						});
					},
					onSuccess: (transcribedText) => {
						rpc.sound.playSoundIfEnabled.execute('transcriptionComplete');

						rpc.delivery.deliverTranscriptionResult.execute({
							text: transcribedText,
							toastId,
						});
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
				rpc.notify.loading.execute({
					title: '🔄 Running transformation...',
					description:
						'Applying your selected transformation to the transcribed text...',
					id: toastId,
				});
				transformRecording.mutate(
					{ recordingId: recording.id, transformation },
					{
						onError: (error) => rpc.notify.error.execute(error),
						onSuccess: (transformationRun) => {
							if (transformationRun.status === 'failed') {
								rpc.notify.error.execute({
									title: '⚠️ Transformation error',
									description: transformationRun.error,
									action: {
										error: transformationRun.error,
										type: 'more-details',
									},
								});
								return;
							}

							rpc.sound.playSoundIfEnabled.execute('transformationComplete');

							rpc.delivery.deliverTransformationResult.execute({
								text: transformationRun.output,
								toastId,
							});
						},
					},
				);
			}}
		/>

		<EditRecordingModal {recording} />

		<CopyToClipboardButton
			contentDescription="transcribed text"
			textToCopy={recording.transcribedText}
			viewTransitionName={getRecordingTransitionId({
				propertyName: 'transcribedText',
				recordingId,
			})}
		>
			<ClipboardIcon class="size-4" />
		</CopyToClipboardButton>

		{#if latestTransformationRunByRecordingIdQuery.isPending}
			<Loader2Icon class="size-4 animate-spin" />
		{:else if latestTransformationRunByRecordingIdQuery.isError}
			<WhisperingTooltip
				id={getRecordingTransitionId({
					propertyName: 'latestTransformationRunOutput',
					recordingId,
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
				contentDescription="latest transformation run output"
				textToCopy={latestTransformationRunByRecordingIdQuery.data?.status ===
				'completed'
					? latestTransformationRunByRecordingIdQuery.data.output
					: ''}
				viewTransitionName={getRecordingTransitionId({
					propertyName: 'latestTransformationRunOutput',
					recordingId,
				})}
			>
				<FileStackIcon class="size-4" />
			</CopyToClipboardButton>
		{/if}

		<ViewTransformationRunsDialog {recordingId} />

		<WhisperingButton
			tooltipContent="Download recording"
			onclick={() =>
				downloadRecording.mutate(recording, {
					onError: (error) => {
						if (error.name === 'WhisperingError') {
							rpc.notify.error.execute(error);
							return;
						}
						rpc.notify.error.execute({
							title: 'Failed to download recording!',
							description: 'Your recording could not be downloaded.',
							action: { error, type: 'more-details' },
						});
					},
					onSuccess: () => {
						rpc.notify.success.execute({
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
					confirmText: 'Delete',
					onConfirm: () =>
						deleteRecording.mutate(recording, {
							onError: (error) => {
								rpc.notify.error.execute({
									title: 'Failed to delete recording!',
									description: 'Your recording could not be deleted.',
									action: { error, type: 'more-details' },
								});
							},
							onSuccess: () => {
								rpc.notify.success.execute({
									title: 'Deleted recording!',
									description: 'Your recording has been deleted.',
								});
							},
						}),
					subtitle: 'Are you sure you want to delete this recording?',
				});
			}}
			variant="ghost"
			size="icon"
		>
			<TrashIcon class="size-4" />
		</WhisperingButton>
	{/if}
</div>
