import { createTextServiceDesktop } from '$lib/services/text/desktop';
import { createTextServiceWeb } from '$lib/services/text/web';

export type { TextService, TextServiceError } from '$lib/services/text/types';

export const TextServiceLive = window.__TAURI_INTERNALS__
	? createTextServiceDesktop()
	: createTextServiceWeb();
