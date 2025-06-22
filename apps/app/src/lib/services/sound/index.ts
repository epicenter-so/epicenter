import { createPlaySoundServiceDesktop } from './desktop';
import { createPlaySoundServiceWeb } from './web';

export type { PlaySoundService, PlaySoundServiceError } from './types';

export const PlaySoundServiceLive = window.__TAURI_INTERNALS__
	? createPlaySoundServiceDesktop()
	: createPlaySoundServiceWeb();
