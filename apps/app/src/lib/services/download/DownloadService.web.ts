import { tryAsync } from '@epicenterhq/result';
import type { DownloadService, DownloadServiceError } from './DownloadService';

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
				mapErr: (error): DownloadServiceError => ({
					name: 'DownloadServiceError',
					message:
						'There was an error saving the recording in your browser. Please try again.',
					context: { name, blob },
					cause: error,
				}),
			}),
	};
}
