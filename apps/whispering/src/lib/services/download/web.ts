import { tryAsync } from 'wellcrafted/result';

import type { DownloadService } from '.';

import { DownloadServiceErr } from './types';

export function createDownloadServiceWeb(): DownloadService {
	return {
		downloadBlob: ({ blob, name }) =>
			tryAsync({
				mapErr: (error) =>
					DownloadServiceErr({
						cause: error,
						context: { blob, name },
						message:
							'There was an error saving the recording in your browser. Please try again.',
					}),
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
			}),
	};
}
