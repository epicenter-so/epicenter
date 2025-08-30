import { getExtensionFromAudioBlob } from '$lib/services/_utils';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { Err, Ok, tryAsync } from 'wellcrafted/result';

import type { DownloadService } from '.';

import { DownloadServiceErr } from './types';

export function createDownloadServiceDesktop(): DownloadService {
	return {
		downloadBlob: async ({ blob, name }) => {
			const extension = getExtensionFromAudioBlob(blob);
			const { data: path, error: saveError } = await tryAsync({
				mapErr: (error) =>
					DownloadServiceErr({
						cause: error,
						context: { blob, name },
						message:
							'There was an error saving the recording using the Tauri Filesystem API. Please try again.',
					}),
				try: async () => {
					const path = await save({
						filters: [{ extensions: [extension], name }],
					});
					return path;
				},
			});
			if (saveError) return Err(saveError);
			if (path === null) {
				return DownloadServiceErr({
					cause: undefined,
					context: { blob, name },
					message: 'Please specify a path to save the recording.',
				});
			}
			const { error: writeError } = await tryAsync({
				mapErr: (error) =>
					DownloadServiceErr({
						cause: error,
						context: { blob, name, path },
						message:
							'There was an error saving the recording using the Tauri Filesystem API. Please try again.',
					}),
				try: async () => {
					const contents = new Uint8Array(await blob.arrayBuffer());
					await writeFile(path, contents);
				},
			});
			if (writeError) return Err(writeError);
			return Ok(undefined);
		},
	};
}
