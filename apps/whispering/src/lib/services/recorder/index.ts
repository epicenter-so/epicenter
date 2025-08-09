import { createDesktopRecorderService } from './desktop';
import { createWebRecorderService } from './web';

/**
 * Platform-aware recorder service that automatically selects the appropriate implementation
 * based on whether we're running in Tauri (desktop) or browser (web)
 */
export const RecorderServiceLive = window.__TAURI_INTERNALS__
	? createDesktopRecorderService()
	: createWebRecorderService();

// Re-export types for convenience
export type { RecorderService, RecorderServiceError } from './types';
