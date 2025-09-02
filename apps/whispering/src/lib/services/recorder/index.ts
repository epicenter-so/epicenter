import { createDesktopRecorderService } from './desktop';
import { createWebRecorderService } from './web';
import { createFfmpegRecorderService } from './ffmpeg';

/**
 * Native recorder service that uses the Rust backend when available.
 * Falls back to browser recording when not in Tauri environment.
 */
export const NativeRecorderServiceLive = window.__TAURI_INTERNALS__
	? createDesktopRecorderService()
	: createWebRecorderService(); // Fallback to web if not in desktop

/**
 * Browser recorder service that always uses the MediaRecorder API,
 * even when running in the desktop app.
 */
export const BrowserRecorderServiceLive = createWebRecorderService();

/**
 * FFmpeg recorder service that uses FFmpeg command-line tool for recording.
 * Only available in desktop environment.
 */
export const FfmpegRecorderServiceLive = window.__TAURI_INTERNALS__
	? createFfmpegRecorderService()
	: createWebRecorderService(); // Fallback to web if not in desktop

// Re-export types for convenience
export type { RecorderService, RecorderServiceError } from './types';
