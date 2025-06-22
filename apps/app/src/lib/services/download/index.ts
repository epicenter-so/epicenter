import { createDownloadServiceDesktop } from './desktop';
import { createDownloadServiceWeb } from './web';

export type { DownloadService, DownloadServiceError } from './types';

export const DownloadServiceLive = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktop()
	: createDownloadServiceWeb();
