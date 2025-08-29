export type { FfmpegService } from '$lib/services/ffmpeg/types';
import { createFfmpegService } from '$lib/services/ffmpeg/desktop';
import { createFfmpegServiceWeb } from '$lib/services/ffmpeg/web';

export const FfmpegServiceLive = window.__TAURI_INTERNALS__
	? createFfmpegService()
	: createFfmpegServiceWeb();
