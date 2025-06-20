/**
 * Keyboard shortcut constants and utilities
 * Single source of truth for keyboard-related constants across the application
 */

/**
 * Local shortcuts structure for browser-based shortcuts
 * Accepts any lowercase key from KeyboardEvent.key
 */
export const LOCAL_SHORTCUTS = {
	Modifiers: {
		keys: ['shift', 'ctrl', 'alt', 'meta'],
		description: 'Hold with other keys',
	},
	'Common Keys': {
		keys: ['enter', 'escape', 'tab', 'space', 'delete', 'backspace'],
		description: 'Frequently used keys',
	},
	'Letters & Numbers': {
		keys: ['a-z', '0-9'],
		description: 'Any letter or number',
	},
	Navigation: {
		keys: [
			'arrowup',
			'arrowdown',
			'arrowleft',
			'arrowright',
			'home',
			'end',
			'pageup',
			'pagedown',
		],
		description: 'Arrow and positioning keys',
	},
	'Function Keys': {
		keys: ['f1-f12'],
		description: 'Function keys',
	},
	Punctuation: {
		keys: [
			'!',
			'@',
			'#',
			'$',
			'%',
			'^',
			'&',
			'*',
			'(',
			')',
			'-',
			'=',
			'[',
			']',
			';',
			"'",
			',',
			'.',
			'/',
			'`',
		],
		description: 'Common symbols',
	},
} as const;

/**
 * Global shortcuts structure for system-wide shortcuts
 * Following Electron Accelerator specification
 */
export const GLOBAL_SHORTCUTS = {
	Modifiers: {
		keys: ['Shift', 'Control', 'Alt', 'CommandOrControl'],
		description: 'Cross-platform modifiers',
	},
	'Common Keys': {
		keys: ['Enter', 'Escape', 'Tab', 'Space', 'Delete', 'Backspace'],
		description: 'Frequently used keys',
	},
	'Letters & Numbers': {
		keys: ['A-Z', '0-9'],
		description: 'Any letter or number',
	},
	Navigation: {
		keys: ['Up', 'Down', 'Left', 'Right', 'Home', 'End', 'PageUp', 'PageDown'],
		description: 'Arrow and positioning keys',
	},
	'Function Keys': {
		keys: ['F1-F24'],
		description: 'Function keys',
	},
} as const;

// Keep these for backward compatibility if needed
export const LOCAL_MODIFIER_KEYS = ['meta', 'control', 'alt', 'shift'] as const;
export const LOCAL_SPECIAL_KEYS = [
	...LOCAL_SHORTCUTS.Modifiers.keys,
	...LOCAL_SHORTCUTS['Common Keys'].keys,
	...LOCAL_SHORTCUTS.Navigation.keys,
	'f1',
	'f2',
	'f3',
	'f4',
	'f5',
	'f6',
	'f7',
	'f8',
	'f9',
	'f10',
	'f11',
	'f12',
] as const;

export const GLOBAL_MODIFIER_KEYS = [
	'Command',
	'Cmd',
	'Control',
	'Ctrl',
	'CommandOrControl',
	'CmdOrCtrl',
	'Alt',
	'Option',
	'AltGr',
	'Shift',
	'Super',
	'Meta',
] as const;

export const GLOBAL_KEY_CODES = {
	'Special Keys': [
		...GLOBAL_SHORTCUTS['Common Keys'].keys,
		...GLOBAL_SHORTCUTS.Navigation.keys,
	],
} as const;

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
		'CommandOrControl+Shift+P',
		'Alt+S',
		'F5',
		'Control+Alt+Delete',
	],
} as const;
