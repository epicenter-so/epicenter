import { DownloadService } from '$lib/services';
import type { Recording } from '$lib/services/db';
import type { DownloadServiceError } from '$lib/services/download/_types';
import { toast } from '$lib/services/toast';
import { Err } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import type { CreateResultMutationOptions } from '@tanstack/svelte-query';

export const download = {
	downloadIndexedDbBlobWithToast: () => () =>
		({
			mutationFn: ({ blob, name }) =>
				DownloadService.downloadBlob({
					name,
					blob,
				}),
			onSuccess: () => {
				toast.success({
					title: 'IndexedDB dump downloaded!',
					description: 'Your IndexedDB dump is being downloaded.',
				});
			},
			onError: (error) => {
				toast.error({
					title: 'Failed to download IndexedDB dump!',
					description: 'Your IndexedDB dump could not be downloaded.',
					action: { type: 'more-details', error },
				});
			},
		}) satisfies CreateResultMutationOptions<
			void,
			DownloadServiceError,
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

				return await DownloadService.downloadBlob({
					name: `whispering_recording_${recording.id}`,
					blob: recording.blob,
				});
			},
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
		}) satisfies CreateResultMutationOptions<
			void,
			WhisperingError | DownloadServiceError,
			Recording
		>,
};
