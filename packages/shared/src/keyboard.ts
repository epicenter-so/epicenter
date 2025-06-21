/**
 * Keyboard shortcut constants and utilities
 * Single source of truth for keyboard-related constants across the application
 */

/**
 * Structured keyboard key sections for local (browser-based) shortcuts.
 * Each section groups related keys with descriptive metadata.
 * Keys are lowercase as returned by KeyboardEvent.key.toLowerCase()
 */
export const SUPPORTED_KEY_SECTIONS = [
	{
		title: 'Modifiers',
		description: 'Hold with other keys',
		keys: [
			'control',
			'shift',
			'alt',
			'meta', // Command on Mac, Windows key on PC
			'altgraph',
			'capslock',
			'numlock',
			'scrolllock',
			'fn',
			'fnlock',
			'hyper',
			'super',
			'symbol',
			'symbollock',
		] as const,
	},
	{
		title: 'Letters',
		description: 'Any letter A-Z',
		keys: [
			'a',
			'b',
			'c',
			'd',
			'e',
			'f',
			'g',
			'h',
			'i',
			'j',
			'k',
			'l',
			'm',
			'n',
			'o',
			'p',
			'q',
			'r',
			's',
			't',
			'u',
			'v',
			'w',
			'x',
			'y',
			'z',
		] as const,
	},
	{
		title: 'Numbers',
		description: 'Number keys 0-9',
		keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const,
	},
	{
		title: 'Symbols & Punctuation',
		description: 'Common symbols and punctuation',
		keys: [
			'`',
			'~',
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
			'{',
			']',
			'}',
			'\\',
			'|',
			';',
			':',
			"'",
			'"',
			',',
			'<',
			'.',
			'>',
			'/',
			'?',
		] as const,
	},
	{
		title: 'Whitespace',
		description: 'Space, enter, and tab keys',
		keys: [' ', 'enter', 'tab'] as const,
	},
	{
		title: 'Navigation',
		description: 'Arrow and positioning keys',
		keys: [
			'arrowleft',
			'arrowright',
			'arrowup',
			'arrowdown',
			'home',
			'end',
			'pageup',
			'pagedown',
		] as const,
	},
	{
		title: 'Editing',
		description: 'Text editing keys',
		keys: [
			'backspace',
			'delete',
			'insert',
			'clear',
			'copy',
			'cut',
			'paste',
			'redo',
			'undo',
		] as const,
	},
	{
		title: 'Function Keys',
		description: 'F1-F24 function keys',
		keys: [
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
			'f13',
			'f14',
			'f15',
			'f16',
			'f17',
			'f18',
			'f19',
			'f20',
			'f21',
			'f22',
			'f23',
			'f24',
		] as const,
	},
	{
		title: 'Special Keys',
		description: 'System and browser keys',
		keys: [
			'escape',
			'contextmenu',
			'pause',
			'break',
			'printscreen',
			'help',
			'browserback',
			'browserforward',
			'browserhome',
			'browserrefresh',
			'browsersearch',
			'browserstop',
			'browserfavorites',
		] as const,
	},
	{
		title: 'Media Keys',
		description: 'Media control keys',
		keys: [
			'mediaplaypause',
			'mediaplay',
			'mediapause',
			'mediastop',
			'mediatracknext',
			'mediatrackprevious',
			'volumeup',
			'volumedown',
			'volumemute',
		] as const,
	},
	{
		title: 'Other Keys',
		description: 'Additional special keys',
		keys: [
			'dead',
			'unidentified',
			'process',
			'compose',
			'accept',
			'again',
			'attn',
			'cancel',
			'execute',
			'find',
			'finish',
			'props',
			'select',
			'zoomout',
			'zoomin',
		] as const,
	},
] as const;

/**
 * Flattened array of all supported local shortcut keys for compatibility.
 * This is derived from SUPPORTED_KEY_SECTIONS for use in validation and type guards.
 */
export const ALL_SUPPORTED_KEYS = [
	...SUPPORTED_KEY_SECTIONS[0].keys, // Modifiers
	...SUPPORTED_KEY_SECTIONS[1].keys, // Letters
	...SUPPORTED_KEY_SECTIONS[2].keys, // Numbers
	...SUPPORTED_KEY_SECTIONS[3].keys, // Symbols
	...SUPPORTED_KEY_SECTIONS[4].keys, // Whitespace
	...SUPPORTED_KEY_SECTIONS[5].keys, // Navigation
	...SUPPORTED_KEY_SECTIONS[6].keys, // Editing
	...SUPPORTED_KEY_SECTIONS[7].keys, // Function
	...SUPPORTED_KEY_SECTIONS[8].keys, // Special
	...SUPPORTED_KEY_SECTIONS[9].keys, // Media
	...SUPPORTED_KEY_SECTIONS[10].keys, // Other
] as const satisfies (typeof SUPPORTED_KEY_SECTIONS)[number]['keys'][number][];

export type SupportedKey = (typeof ALL_SUPPORTED_KEYS)[number];

/**
 * Structured accelerator key sections for global (system-wide) shortcuts.
 * Each section groups related keys with descriptive metadata.
 * Following Electron Accelerator specification.
 */
export const ACCELERATOR_SECTIONS = [
	{
		title: 'Modifiers',
		description: 'Modifier keys for global shortcuts',
		keys: [
			'Command',
			'Cmd', // macOS Command key
			'Control',
			'Ctrl', // Control key
			'CommandOrControl',
			'CmdOrCtrl', // Cross-platform
			'Alt',
			'Option', // Alt/Option key
			'AltGr', // Alt Graph key
			'Shift', // Shift key
			'Super',
			'Meta', // Windows/Linux Super key
		] as const,
	},
	{
		title: 'Letters',
		description: 'Uppercase letters A-Z',
		keys: [
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
		] as const,
	},
	{
		title: 'Numbers',
		description: 'Number keys 0-9',
		keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const,
	},
	{
		title: 'Function Keys',
		description: 'F1-F24 function keys',
		keys: [
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
		] as const,
	},
	{
		title: 'Punctuation',
		description: 'Symbol and punctuation keys',
		keys: [
			')',
			'!',
			'@',
			'#',
			'$',
			'%',
			'^',
			'&',
			'*',
			'(',
			':',
			';',
			'+',
			'=',
			'<',
			',',
			'_',
			'-',
			'>',
			'.',
			'?',
			'/',
			'~',
			'`',
			'{',
			']',
			'[',
			'|',
			'\\',
			'}',
			'"',
			// TODO: Not sure if ' is allowed, see https://github.com/electron/electron/pull/47508/files
			"'",
		] as const,
	},
	{
		title: 'Special Keys',
		description: 'Navigation and control keys',
		keys: [
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
			'Esc',
			'VolumeUp',
			'VolumeDown',
			'VolumeMute',
			'MediaNextTrack',
			'MediaPreviousTrack',
			'MediaStop',
			'MediaPlayPause',
			'PrintScreen',
		] as const,
	},
	{
		title: 'Numpad Keys',
		description: 'Numeric keypad keys',
		keys: [
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
		] as const,
	},
] as const;

/**
 * All accelerator modifier keys
 */
export const ACCELERATOR_MODIFIER_KEYS = ACCELERATOR_SECTIONS[0].keys;
export type AcceleratorModifier = (typeof ACCELERATOR_MODIFIER_KEYS)[number];

/**
 * All accelerator key codes (non-modifiers)
 */
export const ACCELERATOR_KEY_CODES = [
	...ACCELERATOR_SECTIONS[1].keys, // Letters
	...ACCELERATOR_SECTIONS[2].keys, // Numbers
	...ACCELERATOR_SECTIONS[3].keys, // Function
	...ACCELERATOR_SECTIONS[4].keys, // Punctuation
	...ACCELERATOR_SECTIONS[5].keys, // Special
	...ACCELERATOR_SECTIONS[6].keys, // Numpad
] as const satisfies (typeof ACCELERATOR_SECTIONS)[number]['keys'][number][];
export type AcceleratorKeyCode = (typeof ACCELERATOR_KEY_CODES)[number];

/**
 * Flattened array of all accelerator keys for compatibility.
 * This is derived from ACCELERATOR_SECTIONS for use in validation and type guards.
 */
export const ALL_ACCELERATOR_KEYS = [
	...ACCELERATOR_MODIFIER_KEYS, // Modifiers
	...ACCELERATOR_KEY_CODES, // Key codes
] as const satisfies (typeof ACCELERATOR_SECTIONS)[number]['keys'][number][];

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

/**
 * @deprecated Use SUPPORTED_KEY_SECTIONS instead
 */
export const LOCAL_SHORTCUTS = SUPPORTED_KEY_SECTIONS;

/**
 * @deprecated Use ACCELERATOR_SECTIONS instead
 */
export const GLOBAL_SHORTCUTS = ACCELERATOR_SECTIONS;
