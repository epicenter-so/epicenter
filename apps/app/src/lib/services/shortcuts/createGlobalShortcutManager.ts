import {
	Err,
	Ok,
	type Result,
	type TaggedError,
	extractErrorMessage,
	tryAsync,
} from '@epicenterhq/result';
import {
	register as tauriRegister,
	unregister as tauriUnregister,
	unregisterAll as tauriUnregisterAll,
} from '@tauri-apps/plugin-global-shortcut';
import type { ShortcutTriggerState } from './shortcut-trigger-state';
import type { SupportedKey } from './createLocalShortcutManager';
import type { Brand } from '$lib/brand';
import type { CommandId } from '$lib/commands';

type InvalidAcceleratorError = TaggedError<'InvalidAcceleratorError'>;
type GlobalShortcutServiceError = TaggedError<'GlobalShortcutServiceError'>;

/**
 * A type that represents a global shortcut accelerator.
 *
 * @example
 * ```typescript
 * const accelerator: Accelerator = 'CommandOrControl+P';
 * ```
 *
 * @see https://www.electronjs.org/docs/latest/api/accelerator
 */
export type Accelerator = string & Brand<'Accelerator'>;

export function createGlobalShortcutManager() {
	const shortcuts = new Map<
		CommandId,
		{
			on: ShortcutTriggerState;
			accelerator: Accelerator;
			callback: () => void;
		}
	>();

	return {
		async register({
			id,
			accelerator,
			callback,
			on,
		}: {
			id: CommandId;
			accelerator: Accelerator;
			callback: () => void;
			on: ShortcutTriggerState;
		}): Promise<
			Result<void, InvalidAcceleratorError | GlobalShortcutServiceError>
		> {
			if (!isValidElectronAccelerator(accelerator)) {
				return Err({
					name: 'InvalidAcceleratorError',
					message: `Invalid accelerator format: '${accelerator}'. Must follow Electron accelerator specification.`,
					context: { id, accelerator },
					cause: new Error('Invalid accelerator format'),
				});
			}

			// Unregister existing shortcut first
			const { error: unregisterError } = await this.unregister(id);
			if (unregisterError) return Err(unregisterError);

			const { error: registerError } = await tryAsync({
				try: () =>
					tauriRegister(accelerator, (event) => {
						if (
							event.state === 'Pressed' &&
							(on === 'Pressed' || on === 'Both')
						) {
							callback();
						} else if (
							event.state === 'Released' &&
							(on === 'Released' || on === 'Both')
						) {
							callback();
						}
					}),
				mapError: (error): GlobalShortcutServiceError => ({
					name: 'GlobalShortcutServiceError',
					message: `Failed to register global shortcut '${accelerator}': ${extractErrorMessage(error)}`,
					context: { id, accelerator, originalError: error },
					cause: error,
				}),
			});
			if (registerError) return Err(registerError);

			shortcuts.set(id, { accelerator, callback, on });
			return Ok(undefined);
		},

		/**
		 * Unregisters a global shortcut by ID.
		 * This function is idempotent - it can be safely called even if the shortcut
		 * with the given ID doesn't exist or has already been unregistered.
		 */
		async unregister(
			id: CommandId,
		): Promise<Result<void, GlobalShortcutServiceError>> {
			const shortcut = shortcuts.get(id);
			if (!shortcut) return Ok(undefined);

			const { error: unregisterError } = await tryAsync({
				try: () => tauriUnregister(shortcut.accelerator),
				mapError: (error): GlobalShortcutServiceError => ({
					name: 'GlobalShortcutServiceError',
					message: `Failed to unregister global shortcut '${shortcut.accelerator}': ${extractErrorMessage(error)}`,
					context: {
						id,
						accelerator: shortcut.accelerator,
						originalError: error,
					},
					cause: error,
				}),
			});
			if (unregisterError) return Err(unregisterError);
			shortcuts.delete(id);
			return Ok(undefined);
		},

		/**
		 * Unregisters all global shortcuts.
		 * This function is idempotent - it can be safely called even if no shortcuts
		 * are currently registered.
		 */
		async unregisterAll(): Promise<Result<void, GlobalShortcutServiceError>> {
			const { error: unregisterAllError } = await tryAsync({
				try: () => tauriUnregisterAll(),
				mapError: (error): GlobalShortcutServiceError => {
					return {
						name: 'GlobalShortcutServiceError',
						message: `Failed to unregister all global shortcuts: ${extractErrorMessage(error)}`,
						context: { shortcutCount: shortcuts.size, originalError: error },
						cause: error,
					};
				},
			});
			if (unregisterAllError) return Err(unregisterAllError);
			shortcuts.clear();
			return Ok(undefined);
		},
	};
}

/**
 * Valid Electron accelerator modifiers
 */
const ACCELERATOR_MODIFIERS = [
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

type AcceleratorModifier = (typeof ACCELERATOR_MODIFIERS)[number];

/**
 * Valid Electron accelerator key codes
 */
const ACCELERATOR_KEY_CODES = [
	// Numbers 0 to 9
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
	// Letters A to Z
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
	// Function keys F1 to F24
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
	// Various Punctuation
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
	// Special characters
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
	// NumPad Keys
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
] as const;

type AcceleratorKeyCode = (typeof ACCELERATOR_KEY_CODES)[number];

/**
 * Validates if a string is a valid Electron accelerator
 */
export function isValidElectronAccelerator(accelerator: string): boolean {
	const parts = accelerator.split('+');
	if (parts.length === 0) return false;

	const modifiers = parts.slice(0, -1);
	const lastPart = parts.at(-1);

	// Last part must be a key code
	const isLastPartValidKeyCode = ACCELERATOR_KEY_CODES.includes(
		lastPart as AcceleratorKeyCode,
	);
	if (!isLastPartValidKeyCode) return false;

	// All other parts must be modifiers
	for (const modifier of modifiers) {
		if (!ACCELERATOR_MODIFIERS.includes(modifier as AcceleratorModifier))
			return false;
	}

	// Check for duplicate modifiers
	const uniqueModifiers = new Set(modifiers);
	const hasDuplicateModifiers = uniqueModifiers.size !== modifiers.length;
	if (hasDuplicateModifiers) return false;

	return true;
}

/**
 * Convert pressed keys directly to Tauri accelerator format
 */
export function pressedKeysToTauriAccelerator(
	pressedKeys: SupportedKey[],
): string {
	const modifiers: string[] = [];
	const keyCodes: string[] = [];

	for (const key of pressedKeys) {
		const modifier = convertToModifier(key);
		if (modifier) {
			modifiers.push(modifier);
		} else {
			const keyCode = convertToKeyCode(key);
			if (keyCode) {
				keyCodes.push(keyCode);
			}
		}
	}

	// Must have exactly one key code
	if (keyCodes.length === 0) {
		throw new Error('No valid key code found in pressed keys');
	}
	if (keyCodes.length > 1) {
		throw new Error('Multiple key codes not allowed in accelerator');
	}

	// Build accelerator
	const accelerator = [...modifiers, keyCodes[0]].join('+');

	// Final validation
	if (!isValidElectronAccelerator(accelerator)) {
		throw new Error(`Generated invalid accelerator: ${accelerator}`);
	}

	return accelerator;
}

/**
 * Convert a key to an Electron modifier (returns null if not a modifier)
 */
function convertToModifier(key: string): AcceleratorModifier | null {
	const normalized = key.toLowerCase();
	switch (normalized) {
		case 'control':
			return 'Control';
		case 'command':
		case 'meta':
			return 'CommandOrControl';
		case 'alt':
		case 'option':
			return 'Alt';
		case 'shift':
			return 'Shift';
		case 'super':
			return 'Super';
		default:
			return null;
	}
}

/**
 * Convert a key to an Electron key code (returns null if invalid)
 */
function convertToKeyCode(key: string): AcceleratorKeyCode | null {
	const normalized = key.toLowerCase();

	// Special keys
	switch (normalized) {
		case 'space':
			return 'Space';
		case 'enter':
		case 'return':
			return 'Return';
		case 'esc':
		case 'escape':
			return 'Escape';
		case 'tab':
			return 'Tab';
		case 'backspace':
			return 'Backspace';
		case 'delete':
			return 'Delete';
		case 'insert':
			return 'Insert';
		case 'home':
			return 'Home';
		case 'end':
			return 'End';
		case 'pageup':
			return 'PageUp';
		case 'pagedown':
			return 'PageDown';
		case 'up':
		case 'arrowup':
			return 'Up';
		case 'down':
		case 'arrowdown':
			return 'Down';
		case 'left':
		case 'arrowleft':
			return 'Left';
		case 'right':
		case 'arrowright':
			return 'Right';
		case 'capslock':
			return 'Capslock';
		case 'numlock':
			return 'Numlock';
		case 'scrolllock':
			return 'Scrolllock';
	}

	// Function keys
	if (/^f(\d+)$/i.test(normalized)) {
		const num = Number.parseInt(normalized.slice(1));
		if (num >= 1 && num <= 24) {
			return `F${num}`;
		}
	}

	// Numbers
	if (/^[0-9]$/.test(normalized)) {
		return normalized;
	}

	// Letters
	if (/^[a-z]$/.test(normalized)) {
		return normalized.toUpperCase();
	}

	// Numpad keys
	if (normalized.startsWith('numpad')) {
		const numKey = normalized.replace('numpad', '');
		switch (numKey) {
			case '0':
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
				return `num${numKey}`;
			case 'decimal':
				return 'numdec';
			case 'add':
				return 'numadd';
			case 'subtract':
				return 'numsub';
			case 'multiply':
				return 'nummult';
			case 'divide':
				return 'numdiv';
		}
	}

	// Common punctuation
	switch (normalized) {
		case '!':
		case '@':
		case '#':
		case '$':
		case '%':
		case '^':
		case '&':
		case '*':
		case '(':
		case ')':
		case '-':
		case '_':
		case '=':
		case '+':
		case '[':
		case ']':
		case '{':
		case '}':
		case '\\':
		case '|':
		case ';':
		case ':':
		case "'":
		case '"':
		case ',':
		case '.':
		case '<':
		case '>':
		case '/':
		case '?':
		case '`':
		case '~':
			return normalized;
	}

	return null;
}
