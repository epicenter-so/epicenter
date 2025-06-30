import type { AcceleratorPossibleKey } from './possible-keys';

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
			'Alt',
			'Option', // Alt/Option key
			'AltGr', // Alt Graph key
			'Shift', // Shift key
			'Super',
			'Meta', // Windows/Linux Super key
		] as const satisfies AcceleratorPossibleKey[],
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
		] as const satisfies AcceleratorPossibleKey[],
	},
	{
		title: 'Numbers',
		description: 'Number keys 0-9',
		keys: [
			'0',
			'1',
			'2',
			'3',
			'4',
			'5',
			'6',
			'7',
			'8',
			'9',
		] as const satisfies AcceleratorPossibleKey[],
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
		] as const satisfies AcceleratorPossibleKey[],
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
		] as const satisfies AcceleratorPossibleKey[],
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
		] as const satisfies AcceleratorPossibleKey[],
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
		] as const satisfies AcceleratorPossibleKey[],
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
] as const satisfies AcceleratorPossibleKey[];
export type AcceleratorKeyCode = (typeof ACCELERATOR_KEY_CODES)[number];
