import { createClipboardServiceDesktop } from './desktop';
import { createClipboardServiceWeb } from './web';

export type { ClipboardService, ClipboardServiceError } from './types';

export const ClipboardServiceLive = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop()
	: createClipboardServiceWeb();
