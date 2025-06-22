/**
 * Keyboard shortcut constants and utilities
 * Single source of truth for keyboard-related constants across the application
 */

import { createOsServiceDesktop } from '$lib/services/os/desktop';
import { createOsServiceWeb } from '$lib/services/os/web';

const OsService = window.__TAURI_INTERNALS__
	? createOsServiceDesktop()
	: createOsServiceWeb();

export const CommandOrControl =
	OsService.type() === 'macos' ? 'Command' : 'Control';

export const CommandOrAlt = OsService.type() === 'macos' ? 'Command' : 'Alt';
