import { DownloadService } from '$lib/services';
import type { Recording } from '$lib/services/db';
import { toast } from '$lib/services/toast';
import { Err, Ok } from '@epicenterhq/result';
import { WhisperingError } from '@repo/shared';
import { createMutation } from '@tanstack/svelte-query';

export function useDownloadIndexedDbBlobWithToast() {
	return {
		downloadIndexedDbBlobWithToast: createMutation(() => ({
			mutationFn: async ({ blob, name }: { blob: Blob; name: string }) => {
				const { error: downloadBlobError } = await DownloadService.downloadBlob(
					{ name, blob },
				);
				if (downloadBlobError) {
					toast.error(downloadBlobError);
					return Err(downloadBlobError);
				}
				toast.success({
					title: 'IndexedDB dump downloaded!',
					description: 'Your IndexedDB dump is being downloaded.',
				});
				return Ok(undefined);
			},
		})),
	};
}

export function useDownloadRecordingWithToast() {
	return {
		downloadRecordingWithToast: createMutation(() => ({
			mutationFn: async (recording: Recording) => {
				if (!recording.blob) {
					const e = WhisperingError({
						title: '⚠️ Recording blob not found',
						description: "Your recording doesn't have a blob to download.",
					});
					toast.error(e.error);
					return e;
				}
				const { error: downloadBlobError } = await DownloadService.downloadBlob(
					{
						name: `whispering_recording_${recording.id}`,
						blob: recording.blob,
					},
				);
				if (downloadBlobError) {
					const e = WhisperingError({
						title: 'Failed to download recording!',
						description: 'Your recording could not be downloaded.',
						action: { type: 'more-details', error: downloadBlobError },
					});
					toast.error(e.error);
					return e;
				}

				toast.success({
					title: 'Recording downloading!',
					description: 'Your recording is being downloaded.',
				});
				return Ok(undefined);
			},
		})),
	};
}
