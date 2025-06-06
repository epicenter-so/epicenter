import { getExtensionFromAudioBlob } from '$lib/utils';
import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { DownloadService, DownloadServiceError } from './_types';

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
				mapError: (error): DownloadServiceError => ({
					name: 'DownloadServiceError',
					message:
						'There was an error saving the recording using the Tauri Filesystem API. Please try again.',
					context: { name, blob },
					cause: error,
				}),
			});
			if (saveError) return Err(saveError);
			if (path === null) {
				return Err({
					name: 'DownloadServiceError',
					message: 'Please specify a path to save the recording.',
					context: { name, blob },
					cause: undefined,
				} satisfies DownloadServiceError);
			}
			const { error: writeError } = await tryAsync({
				try: async () => {
					const contents = new Uint8Array(await blob.arrayBuffer());
					await writeFile(path, contents);
				},
				mapError: (error): DownloadServiceError => ({
					name: 'DownloadServiceError',
					message:
						'There was an error saving the recording using the Tauri Filesystem API. Please try again.',
					context: { name, blob, path },
					cause: error,
				}),
			});
			if (writeError) return Err(writeError);
			return Ok(undefined);
		},
	};
}
