import { IS_WINDOWS } from '$lib/constants/platform';
import { extractErrorMessage } from 'wellcrafted/error';
import { Err, Ok, tryAsync } from 'wellcrafted/result';

import { type FfmpegService, FfmpegServiceErr } from './types';

export function createFfmpegService(): FfmpegService {
	return {
		async checkInstalled() {
			const { data: shellFfmpegProcess, error: shellFfmpegError } =
				await tryAsync({
					mapErr: (error) =>
						FfmpegServiceErr({
							cause: error,
							message: `Unable to determine if FFmpeg is installed through shell. ${extractErrorMessage(error)}`,
						}),
					try: async () => {
						const { Command } = await import('@tauri-apps/plugin-shell');
						const output = await (IS_WINDOWS
							? Command.create('cmd', ['/c', 'ffmpeg -version'])
							: Command.create('sh', ['-c', 'ffmpeg -version'])
						).execute();
						return output;
					},
				});

			if (shellFfmpegError) return Err(shellFfmpegError);
			return Ok(shellFfmpegProcess.code === 0);
		},
	};
}
