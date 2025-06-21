import { services } from '$lib/services';
import type { Recording } from '$lib/services/db';
import type { DownloadServiceError } from '$lib/services/download/_types';
import { Err, type Result } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';
import { defineMutation } from '../_utils';

export const download = {
	downloadRecording: defineMutation({
		mutationKey: ['download', 'downloadRecording'] as const,
		resultMutationFn: async (
			recording: Recording,
		): Promise<Result<void, WhisperingError | DownloadServiceError>> => {
			if (!recording.blob) {
				return Err({
					name: 'WhisperingError',
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to download.",
					context: { recording },
					cause: undefined,
				} satisfies WhisperingError);
			}

			return await services.download.downloadBlob({
				name: `whispering_recording_${recording.id}`,
				blob: recording.blob,
			});
		},
	}),
};
