import { readFile } from '@tauri-apps/plugin-fs';
import { basename } from '@tauri-apps/api/path';
import { MIME_TYPE_MAP } from '$lib/constants/mime';
import { tryAsync } from 'wellcrafted/result';
import type { FsService } from './types';
import { FsServiceErr } from './types';

/**
 * Get MIME type from file path (internal helper)
 */
function getMimeTypeFromPath(filePath: string): string {
	const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
	return MIME_TYPE_MAP[ext as keyof typeof MIME_TYPE_MAP] ?? 'application/octet-stream';
}

export function createFsServiceDesktop(): FsService {
	return {
		pathToBlob: async (path: string) => {
			return tryAsync({
				try: async () => {
					const fileBytes = await readFile(path);
					const mimeType = getMimeTypeFromPath(path);
					return new Blob([fileBytes], { type: mimeType });
				},
				mapErr: (error) =>
					FsServiceErr({
						message: `Failed to read file as Blob: ${path}`,
						cause: error,
					}),
			});
		},

		pathToFile: async (path: string) => {
			return tryAsync({
				try: async () => {
					const fileBytes = await readFile(path);
					const fileName = await basename(path);
					const mimeType = getMimeTypeFromPath(path);
					return new File([fileBytes], fileName, { type: mimeType });
				},
				mapErr: (error) =>
					FsServiceErr({
						message: `Failed to read file as File: ${path}`,
						cause: error,
					}),
			});
		},

		pathsToFiles: async (paths: string[]) => {
			return tryAsync({
				try: async () => {
					const files: File[] = [];
					for (const path of paths) {
						const fileBytes = await readFile(path);
						const fileName = await basename(path);
						const mimeType = getMimeTypeFromPath(path);
						const file = new File([fileBytes], fileName, { type: mimeType });
						files.push(file);
					}
					return files;
				},
				mapErr: (error) =>
					FsServiceErr({
						message: `Failed to read files: ${paths.join(', ')}`,
						cause: error,
					}),
			});
		},
	};
}