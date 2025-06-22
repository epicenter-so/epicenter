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

/**
 * Examples for each shortcut type
 */
export const SHORTCUT_EXAMPLES = {
	local: [
		' ',
		`${CommandOrControl.toLowerCase()}+a`,
		`${CommandOrControl.toLowerCase()}+shift+p`,
		`${CommandOrAlt.toLowerCase()}+s`,
		'f5',
		`control+${CommandOrAlt.toLowerCase()}+delete`,
	],
	global: [
		'Space',
		'Control+A',
		`${CommandOrControl}+Shift+P`,
		`${CommandOrAlt}+S`,
		'F5',
		`Control+${CommandOrAlt}+Delete`,
	],
} as const;
