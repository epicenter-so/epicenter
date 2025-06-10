import { DownloadService } from '$lib/services';
import type { Recording } from '$lib/services/db';
import type { DownloadServiceError } from '$lib/services/download/_types';
import { Err, type Result } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import { defineMutation } from '.';

export const download = {
	downloadRecording: defineMutation({
		mutationKey: ['download', 'downloadRecording'] as const,
		mutationFn: async (
			recording: Recording,
		): Promise<Result<void, WhisperingError | DownloadServiceError>> => {
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
	}),
};
