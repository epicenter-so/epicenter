import type { KeyboardEventPossibleKey } from './possible-keys';

/**
 * Structured keyboard key sections for local (browser-based) shortcuts.
 * Each section groups related keys with descriptive metadata.
 * Keys are lowercase as returned by KeyboardEvent.key.toLowerCase()
 */
export const KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS = [
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
			'super',
		] as const satisfies KeyboardEventPossibleKey[],
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
		] as const satisfies KeyboardEventPossibleKey[],
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
		] as const satisfies KeyboardEventPossibleKey[],
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
		] as const satisfies KeyboardEventPossibleKey[],
	},
	{
		title: 'Whitespace',
		description: 'Space, enter, and tab keys',
		keys: [' ', 'enter', 'tab'] as const satisfies KeyboardEventPossibleKey[],
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
		] as const satisfies KeyboardEventPossibleKey[],
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
		] as const satisfies KeyboardEventPossibleKey[],
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
		] as const satisfies KeyboardEventPossibleKey[],
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
		] as const satisfies KeyboardEventPossibleKey[],
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
		] as const satisfies KeyboardEventPossibleKey[],
	},
	{
		title: 'Other Keys',
		description: 'Additional special keys',
		keys: [
			'dead',
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
		] as const satisfies KeyboardEventPossibleKey[],
	},
] as const;

/**
 * Flattened array of all supported local shortcut keys for compatibility.
 * This is derived from KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS for use in validation and type guards.
 */
export const KEYBOARD_EVENT_SUPPORTED_KEYS = [
	...KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS[0].keys, // Modifiers
	...KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS[1].keys, // Letters
	...KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS[2].keys, // Numbers
	...KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS[3].keys, // Symbols
	...KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS[4].keys, // Whitespace
	...KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS[5].keys, // Navigation
	...KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS[6].keys, // Editing
	...KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS[7].keys, // Function
	...KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS[8].keys, // Special
	...KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS[9].keys, // Media
	...KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS[10].keys, // Other
] as const satisfies (typeof KEYBOARD_EVENT_SUPPORTED_KEY_SECTIONS)[number]['keys'][number][];

export type KeyboardEventSupportedKey =
	(typeof KEYBOARD_EVENT_SUPPORTED_KEYS)[number];

/**
 * Type guard that validates whether a KeyboardEventPossibleKey (any key from the browser)
 * is one of our chosen SupportedKeys. This function acts as a gatekeeper,
 * filtering out keys we've decided not to support while providing type safety.
 *
 * When this returns true, TypeScript narrows the type from KeyboardEventPossibleKey to
 * KeyboardEventSupportedKey, giving you compile-time guarantees about the key's validity.
 *
 * @param key - Any key value from KeyboardEvent.key.toLowerCase()
 * @returns True if we've chosen to support this key for shortcuts, false otherwise
 *
 * @example
 * ```typescript
 * const key = e.key.toLowerCase() as KeyboardEventPossibleKey;
 * if (isSupportedKey(key)) {
 *   // TypeScript now knows this is a KeyboardEventSupportedKey - our validated choice!
 *   pressedKeys.push(key);
 * }
 * ```
 */
export function isSupportedKey(
	key: KeyboardEventPossibleKey,
): key is KeyboardEventSupportedKey {
	return KEYBOARD_EVENT_SUPPORTED_KEYS.includes(
		key as KeyboardEventSupportedKey,
	);
}
