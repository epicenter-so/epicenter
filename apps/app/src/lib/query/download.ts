import { DownloadService } from '$lib/services';
import type { Recording } from '$lib/services/db';
import { toast } from '$lib/services/toast';
import { Err, Ok } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import type { CreateResultMutationOptions } from '@tanstack/svelte-query';

export const download = {
	downloadIndexedDbBlobWithToast: () => () =>
		({
			mutationFn: async ({ blob, name }) => {
				const { error: downloadBlobError } = await DownloadService.downloadBlob(
					{
						name,
						blob,
					},
				);
				if (downloadBlobError) {
					const whisperingError = {
						name: 'WhisperingError',
						title: 'Failed to download IndexedDB dump!',
						description: 'Your IndexedDB dump could not be downloaded.',
						action: { type: 'more-details', error: downloadBlobError },
						context: { name },
						cause: downloadBlobError,
					} satisfies WhisperingError;
					return Err(whisperingError);
				}
				return Ok(undefined);
			},
			onSuccess: () => {
				toast.success({
					title: 'IndexedDB dump downloaded!',
					description: 'Your IndexedDB dump is being downloaded.',
				});
			},
			onError: (error) => {
				toast.error(error);
			},
		}) satisfies CreateResultMutationOptions<
			undefined,
			WhisperingError,
			{ blob: Blob; name: string }
		>,
	downloadRecordingWithToast: () => () =>
		({
			mutationFn: async (recording) => {
				if (!recording.blob) {
					return Err({
						name: 'WhisperingError',
						title: '⚠️ Recording blob not found',
						description: "Your recording doesn't have a blob to download.",
						context: { recording },
						cause: new Error('Recording blob not found'),
					} satisfies WhisperingError);
				}

				const { error: downloadBlobError } = await DownloadService.downloadBlob(
					{
						name: `whispering_recording_${recording.id}`,
						blob: recording.blob,
					},
				);

				if (downloadBlobError) {
					return Err({
						name: 'WhisperingError',
						title: 'Failed to download recording!',
						description: 'Your recording could not be downloaded.',
						action: { type: 'more-details', error: downloadBlobError },
						context: { recording },
						cause: downloadBlobError,
					} satisfies WhisperingError);
				}

				return Ok(undefined);
			},
			onError: (error) => {
				toast.error(error);
			},
			onSuccess: () => {
				toast.success({
					title: 'Recording downloaded!',
					description: 'Your recording has been downloaded.',
				});
			},
		}) satisfies CreateResultMutationOptions<
			undefined,
			WhisperingError,
			Recording
		>,
};
