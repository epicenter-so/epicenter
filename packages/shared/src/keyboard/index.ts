/**
 * Keyboard shortcut constants and utilities
 * Single source of truth for keyboard-related constants across the application
 */

export {
	SUPPORTED_KEY_SECTIONS,
	ALL_SUPPORTED_KEYS,
	type SupportedKey,
} from './local.js';

export {
	ACCELERATOR_SECTIONS,
	ACCELERATOR_MODIFIER_KEYS,
	ACCELERATOR_KEY_CODES,
	type AcceleratorModifier,
	type AcceleratorKeyCode,
} from './desktop.js';

/**
 * Examples for each shortcut type
 */
export const SHORTCUT_EXAMPLES = {
	local: [
		' ',
		'control+a',
		'command+shift+p',
		'alt+s',
		'f5',
		'control+alt+delete',
	],
	global: [
		'Space',
		'Control+A',
		`${CommandOrControl}+Shift+P`,
		'Alt+S',
		'F5',
		'Control+Alt+Delete',
	],
} as const;
