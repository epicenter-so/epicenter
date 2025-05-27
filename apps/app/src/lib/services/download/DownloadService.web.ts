import { tryAsync } from '@epicenterhq/result';
import { WhisperingError } from '@repo/shared';
import type { DownloadService } from './DownloadService';

export function createDownloadServiceWeb(): DownloadService {
	return {
		downloadBlob: ({ name, blob }) =>
			tryAsync({
				try: async () => {
					const file = new File([blob], name, { type: blob.type });
					const url = URL.createObjectURL(file);
					const a = document.createElement('a');
					a.href = url;
					a.download = name;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
				},
				mapErr: (error) =>
					WhisperingError({
						title: 'Error saving recording',
						description:
							'There was an error saving the recording in your browser. Please try again.',
						action: { type: 'more-details', error },
					}),
			}),
	};
}
