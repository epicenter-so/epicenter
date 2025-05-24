import { getExtensionFromAudioBlob } from '$lib/utils';
import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { WhisperingError } from '@repo/shared';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { DownloadService } from './DownloadService';

export function createDownloadServiceDesktop(): DownloadService {
	return {
		downloadBlob: async ({ name, blob }) => {
			const extension = getExtensionFromAudioBlob(blob);
			const { data: path, error: saveError } = await tryAsync({
				try: async () => {
					const path = await save({
						filters: [{ name, extensions: [extension] }],
					});
					return path;
				},
				mapErr: (error) =>
					WhisperingError({
						title: 'Error saving recording',
						description:
							'There was an error saving the recording using the Tauri Filesystem API. Please try again.',
						action: { type: 'more-details', error },
					}),
			});
			if (saveError) return Err(saveError);
			if (path === null) {
				return Err(
					WhisperingError({
						title: 'Error saving recording',
						description:
							'There was an error saving the recording using the Tauri Filesystem API. Please try again.',
						action: { type: 'more-details', error: 'path is null' },
					}),
				);
			}
			const { error: writeError } = await tryAsync({
				try: async () => {
					const contents = new Uint8Array(await blob.arrayBuffer());
					await writeFile(path, contents);
				},
				mapErr: (error) =>
					WhisperingError({
						title: 'Error saving recording',
						description:
							'There was an error saving the recording using the Tauri Filesystem API. Please try again.',
						action: { type: 'more-details', error },
					}),
			});
			if (writeError) return Err(writeError);
			return Ok(undefined);
		},
	};
}
