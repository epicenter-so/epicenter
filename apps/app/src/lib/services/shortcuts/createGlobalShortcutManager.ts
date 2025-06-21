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
	isRegistered as tauriIsRegistered,
} from '@tauri-apps/plugin-global-shortcut';
import type { ShortcutTriggerState } from './shortcut-trigger-state';
import type { SupportedKey } from './createLocalShortcutManager';
import type { Brand } from '$lib/brand';
import type { CommandId } from '$lib/commands';
import * as os from '@tauri-apps/plugin-os';

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
					cause: undefined,
				});
			}

			const { error: registerError } = await tryAsync({
				try: () =>
					tauriRegister(accelerator, (event) => {
						if (on === 'Both') {
							callback();
							return;
						}
						if (on === 'Pressed' && event.state === 'Pressed') {
							callback();
							return;
						}
						if (on === 'Released' && event.state === 'Released') {
							callback();
							return;
						}
					}),
				mapError: (error): GlobalShortcutServiceError => ({
					name: 'GlobalShortcutServiceError',
					message: `Failed to register global shortcut '${accelerator}': ${extractErrorMessage(error)}`,
					context: { id, accelerator, error },
					cause: error,
				}),
			});
			/**
			 * NOTE: We often get "RegisterEventHotKey failed for <key>" errors when
			 * registering global shortcuts, even though the shortcut was valid and
			 * registered successfully. This is a known issue with the underlying system
			 * API on certain platforms. We gracefully return Ok(undefined) in these
			 * cases to avoid propagating the error as an unnecessary error toast,
			 * allowing the shortcut system to continue functioning for other valid keys.
			 */
			if (registerError) return Ok(undefined);

			return Ok(undefined);
		},

		/**
		 * Unregisters a global shortcut by ID.
		 * This function is idempotent - it can be safely called even if the shortcut
		 * with the given ID doesn't exist or has already been unregistered.
		 */
		async unregister(
			accelerator: Accelerator,
		): Promise<Result<void, GlobalShortcutServiceError>> {
			const isRegistered = await tauriIsRegistered(accelerator);
			if (!isRegistered) return Ok(undefined);

			const { error: unregisterError } = await tryAsync({
				try: () => tauriUnregister(accelerator),
				mapError: (error): GlobalShortcutServiceError => ({
					name: 'GlobalShortcutServiceError',
					message: `Failed to unregister global shortcut '${accelerator}': ${extractErrorMessage(error)}`,
					context: {
						accelerator,
						originalError: error,
					},
					cause: error,
				}),
			});
			if (unregisterError) return Err(unregisterError);
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
						context: { error },
						cause: error,
					};
				},
			});
			if (unregisterAllError) return Err(unregisterAllError);
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
): Result<Accelerator, InvalidAcceleratorError> {
	const modifiers: AcceleratorModifier[] = [];
	const keyCodes: AcceleratorKeyCode[] = [];

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
		return Err({
			name: 'InvalidAcceleratorError',
			message: 'No valid key code found in pressed keys',
			context: { pressedKeys },
			cause: undefined,
		});
	}
	if (keyCodes.length > 1) {
		return Err({
			name: 'InvalidAcceleratorError',
			message: 'Multiple key codes not allowed in accelerator',
			context: { pressedKeys, keyCodes },
			cause: undefined,
		});
	}

	// Sort modifiers in standard order for consistency
	const sortedModifiers = sortModifiers(modifiers);

	// Build accelerator
	const accelerator = [...sortedModifiers, keyCodes[0]].join(
		'+',
	) as Accelerator;

	// Final validation
	if (!isValidElectronAccelerator(accelerator)) {
		return Err({
			name: 'InvalidAcceleratorError',
			message: `Generated invalid accelerator: ${accelerator}`,
			context: { pressedKeys, accelerator },
			cause: undefined,
		});
	}

	return Ok(accelerator);
}

/**
 * Converts a browser KeyboardEvent.key value (lowercase) to an Electron Accelerator modifier.
 *
 * This function handles platform-specific differences in how modifier keys are represented:
 * - Browser normalizes platform keys (e.g., Command key → "meta", Option key → "alt")
 * - Electron expects platform-specific modifiers (e.g., "Command" on macOS, "Super" on Windows/Linux)
 *
 * @param key - The lowercase key value from a KeyboardEvent (e.g., "control", "alt", "meta")
 * @returns The corresponding Electron Accelerator modifier, or null if the key is not a modifier
 *
 * @example
 * // On macOS
 * convertToModifier('meta') // Returns 'Command'
 * convertToModifier('alt')  // Returns 'Option'
 *
 * @example
 * // On Windows/Linux
 * convertToModifier('meta') // Returns 'Super'
 * convertToModifier('alt')  // Returns 'Alt'
 *
 * @example
 * // Cross-platform
 * convertToModifier('control') // Returns 'Control' on all platforms
 * convertToModifier('shift')   // Returns 'Shift' on all platforms
 * convertToModifier('space')   // Returns null (not a modifier)
 */
function convertToModifier(key: SupportedKey): AcceleratorModifier | null {
	const platform = os.type();

	switch (key) {
		case 'control':
			// Control key is consistent across all platforms
			return 'Control';

		case 'shift':
			// Shift key is consistent across all platforms
			return 'Shift';

		case 'alt':
			// Alt key is called "Option" on macOS in Electron accelerators
			return platform === 'macos' ? 'Option' : 'Alt';

		case 'meta':
			// Meta key maps differently based on platform:
			// - macOS: Command key (reported as "meta" by browser)
			// - Windows/Linux: Windows/Super key (reported as "meta" by browser)
			return platform === 'macos' ? 'Command' : 'Super';

		case 'altgraph':
			// AltGr is not available on macOS
			return platform === 'macos' ? null : 'AltGr';

		// These keys might be reported by browsers but aren't standard Electron modifiers
		case 'super':
			// "super" as a key value (different from Meta) maps to Super modifier
			return 'Super';

		case 'hyper':
		case 'fn':
			// These are not supported as Electron accelerator modifiers
			return null;

		default:
			// Any other key is not a modifier
			return null;
	}
}

/**
 * Convert a key to an Electron key code (returns null if invalid)
 */
function convertToKeyCode(key: SupportedKey): AcceleratorKeyCode | null {
	// Single letters - convert to uppercase
	if (key.length === 1 && key >= 'a' && key <= 'z') {
		return key.toUpperCase() as AcceleratorKeyCode;
	}

	// Numbers - return as-is
	if (key.length === 1 && key >= '0' && key <= '9') {
		return key as AcceleratorKeyCode;
	}

	// Function keys - convert to uppercase
	if (key.match(/^f\d{1,2}$/)) {
		return key.toUpperCase() as AcceleratorKeyCode;
	}

	// Special key mappings
	const keyMappings: Record<string, AcceleratorKeyCode> = {
		// Arrow keys
		arrowup: 'Up',
		arrowdown: 'Down',
		arrowleft: 'Left',
		arrowright: 'Right',

		// Whitespace
		' ': 'Space',
		enter: 'Enter',
		tab: 'Tab',

		// Special keys
		escape: 'Escape',
		backspace: 'Backspace',
		delete: 'Delete',
		insert: 'Insert',
		home: 'Home',
		end: 'End',
		pageup: 'PageUp',
		pagedown: 'PageDown',
		printscreen: 'PrintScreen',

		// Media keys
		volumeup: 'VolumeUp',
		volumedown: 'VolumeDown',
		volumemute: 'VolumeMute',
		mediaplaypause: 'MediaPlayPause',
		mediastop: 'MediaStop',
		mediatracknext: 'MediaNextTrack',
		mediatrackprevious: 'MediaPreviousTrack',

		// Lock keys (when used as regular keys, not modifiers)
		capslock: 'Capslock',
		numlock: 'Numlock',
		scrolllock: 'Scrolllock',
	};

	if (keyMappings[key]) {
		return keyMappings[key];
	}

	// Punctuation and symbols - most are valid as-is
	const validPunctuation = [
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
		"'",
	];

	if (validPunctuation.includes(key)) {
		return key as AcceleratorKeyCode;
	}

	// Key not supported as an accelerator key code
	return null;
}

/**
 * Sort modifiers in a standard order for consistency
 * Order: CommandOrControl/Ctrl, Alt, Shift, Meta (if separate)
 */
function sortModifiers(
	modifiers: AcceleratorModifier[],
): AcceleratorModifier[] {
	const order: Record<AcceleratorModifier, number> = {
		Command: 1,
		Cmd: 1,
		Control: 1,
		Ctrl: 1,
		CommandOrControl: 1,
		CmdOrCtrl: 1,
		Alt: 2,
		Option: 2,
		AltGr: 3,
		Shift: 4,
		Super: 5,
		Meta: 5,
	};

	return modifiers.sort((a, b) => {
		const orderA = order[a] || 99;
		const orderB = order[b] || 99;
		return orderA - orderB;
	});
}
