/**
 * Keyboard shortcut constants and utilities
 * Single source of truth for keyboard-related constants across the application
 */

/**
 * Modifier keys supported by local shortcuts (browser-based)
 * These are the actual key values from KeyboardEvent.key in lowercase
 */
export const LOCAL_MODIFIER_KEYS = ['meta', 'control', 'alt', 'shift'] as const;

/**
 * Common special keys displayed to users for local shortcuts
 * Showing the most commonly used keys that work across browsers
 */
export const LOCAL_SPECIAL_KEYS = [
	'backspace',
	'tab',
	'enter',
	'escape',
	' ',
	'arrowup',
	'arrowdown',
	'arrowleft',
	'arrowright',
	'home',
	'end',
	'pageup',
	'pagedown',
	'delete',
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

/**
 * Valid Electron accelerator modifiers for global shortcuts
 * These follow the Electron Accelerator specification
 */
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

/**
 * Valid Electron accelerator key codes for global shortcuts
 * These follow the Electron Accelerator specification
 */
export const GLOBAL_KEY_CODES = {
	letters: [
		'A',
		'B',
		'C',
		'D',
		'E',
		'F',
		'G',
		'H',
		'I',
		'J',
		'K',
		'L',
		'M',
		'N',
		'O',
		'P',
		'Q',
		'R',
		'S',
		'T',
		'U',
		'V',
		'W',
		'X',
		'Y',
		'Z',
	],
	numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
	functionKeys: [
		'F1',
		'F2',
		'F3',
		'F4',
		'F5',
		'F6',
		'F7',
		'F8',
		'F9',
		'F10',
		'F11',
		'F12',
		'F13',
		'F14',
		'F15',
		'F16',
		'F17',
		'F18',
		'F19',
		'F20',
		'F21',
		'F22',
		'F23',
		'F24',
	],
	specialKeys: [
		'Plus',
		'Space',
		'Tab',
		'Capslock',
		'Numlock',
		'Scrolllock',
		'Backspace',
		'Delete',
		'Insert',
		'Return',
		'Enter',
		'Up',
		'Down',
		'Left',
		'Right',
		'Home',
		'End',
		'PageUp',
		'PageDown',
		'Escape',
		'VolumeUp',
		'VolumeDown',
		'VolumeMute',
		'MediaNextTrack',
		'MediaPreviousTrack',
		'MediaStop',
		'MediaPlayPause',
	],
	numpadKeys: [
		'num0',
		'num1',
		'num2',
		'num3',
		'num4',
		'num5',
		'num6',
		'num7',
		'num8',
		'num9',
		'numdec',
		'numadd',
		'numsub',
		'nummult',
		'numdiv',
	],
	punctuation: [
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
		'_',
		'=',
		'+',
		'[',
		']',
		'{',
		'}',
		'\\',
		'|',
		';',
		':',
		"'",
		'"',
		',',
		'.',
		'<',
		'>',
		'/',
		'?',
		'`',
		'~',
	],
} as const;

/**
 * Examples for each shortcut type
 */
export const SHORTCUT_EXAMPLES = {
	local: [' ', 'ctrl+a', 'cmd+shift+p', 'alt+s', 'f5', 'ctrl+alt+delete'],
	global: [
		'Space',
		'Control+A',
		'CommandOrControl+Shift+P',
		'Alt+S',
		'F5',
		'Control+Alt+Delete',
	],
} as const;
