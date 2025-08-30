import type { Brand } from 'wellcrafted/brand';

import {
	ACCELERATOR_KEY_CODES,
	ACCELERATOR_MODIFIER_KEYS,
	type AcceleratorKeyCode,
	type AcceleratorModifier,
	type KeyboardEventSupportedKey,
} from '$lib/constants/keyboard';
import {
	isRegistered as tauriIsRegistered,
	register as tauriRegister,
	unregister as tauriUnregister,
	unregisterAll as tauriUnregisterAll,
} from '@tauri-apps/plugin-global-shortcut';
import * as os from '@tauri-apps/plugin-os';
import { createTaggedError, extractErrorMessage } from 'wellcrafted/error';
import { Err, Ok, type Result, tryAsync } from 'wellcrafted/result';

import type { ShortcutTriggerState } from './_shortcut-trigger-state';

const { InvalidAcceleratorErr, InvalidAcceleratorError } = createTaggedError(
	'InvalidAcceleratorError',
);
type InvalidAcceleratorError = ReturnType<typeof InvalidAcceleratorError>;
const { GlobalShortcutServiceErr, GlobalShortcutServiceError } =
	createTaggedError('GlobalShortcutServiceError');
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
export type Accelerator = Brand<'Accelerator'> & string;

type GlobalShortcutServiceError = ReturnType<typeof GlobalShortcutServiceError>;

export function createGlobalShortcutManager() {
	return {
		async register({
			accelerator,
			callback,
			on,
		}: {
			accelerator: Accelerator;
			callback: () => void;
			on: ShortcutTriggerState;
		}): Promise<
			Result<void, GlobalShortcutServiceError | InvalidAcceleratorError>
		> {
			const { error: unregisterError } = await this.unregister(accelerator);
			if (unregisterError) return Err(unregisterError);

			if (!isValidElectronAccelerator(accelerator)) {
				return InvalidAcceleratorErr({
					cause: undefined,
					context: { accelerator },
					message: `Invalid accelerator format: '${accelerator}'. Must follow Electron accelerator specification.`,
				});
			}

			const { error: registerError } = await tryAsync({
				mapErr: (error) =>
					GlobalShortcutServiceErr({
						cause: error,
						context: { accelerator, error },
						message: `Failed to register global shortcut '${accelerator}': ${extractErrorMessage(error)}`,
					}),
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
				mapErr: (error) =>
					GlobalShortcutServiceErr({
						cause: error,
						context: {
							accelerator,
							originalError: error,
						},
						message: `Failed to unregister global shortcut '${accelerator}': ${extractErrorMessage(error)}`,
					}),
				try: () => tauriUnregister(accelerator),
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
				mapErr: (error) =>
					GlobalShortcutServiceErr({
						cause: error,
						context: { error },
						message: `Failed to unregister all global shortcuts: ${extractErrorMessage(error)}`,
					}),
				try: () => tauriUnregisterAll(),
			});
			if (unregisterAllError) return Err(unregisterAllError);
			return Ok(undefined);
		},
	};
}

/**
 * Validates if a string is a valid Electron accelerator
 */
export function isValidElectronAccelerator(accelerator: string): boolean {
	const parts = accelerator.split('+');
	if (parts.length === 0) return false;

	const modifiers = parts.slice(0, -1);
	const lastPart = parts.at(-1);

	// Last part must be a key code (exclude modifiers)
	const isLastPartValidKeyCode = ACCELERATOR_KEY_CODES.includes(
		lastPart as AcceleratorKeyCode,
	);
	if (!isLastPartValidKeyCode) return false;

	// All other parts must be modifiers
	for (const modifier of modifiers) {
		if (!ACCELERATOR_MODIFIER_KEYS.includes(modifier as AcceleratorModifier))
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
	pressedKeys: KeyboardEventSupportedKey[],
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
		return InvalidAcceleratorErr({
			cause: undefined,
			context: { pressedKeys },
			message: 'No valid key code found in pressed keys',
		});
	}
	if (keyCodes.length > 1) {
		return InvalidAcceleratorErr({
			cause: undefined,
			context: { keyCodes, pressedKeys },
			message: 'Multiple key codes not allowed in accelerator',
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
		return InvalidAcceleratorErr({
			cause: undefined,
			context: { accelerator, pressedKeys },
			message: `Generated invalid accelerator: ${accelerator}`,
		});
	}

	return Ok(accelerator);
}

/**
 * Convert a key to an Electron key code (returns null if invalid)
 */
function convertToKeyCode(
	key: KeyboardEventSupportedKey,
): AcceleratorKeyCode | null {
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
		// Whitespace
		' ': 'Space',
		arrowdown: 'Down',
		arrowleft: 'Left',
		arrowright: 'Right',

		// Arrow keys
		arrowup: 'Up',
		backspace: 'Backspace',
		// Lock keys (when used as regular keys, not modifiers)
		capslock: 'Capslock',

		delete: 'Delete',
		end: 'End',
		enter: 'Enter',
		// Special keys
		escape: 'Escape',
		home: 'Home',
		insert: 'Insert',
		mediaplaypause: 'MediaPlayPause',
		mediastop: 'MediaStop',
		mediatracknext: 'MediaNextTrack',

		mediatrackprevious: 'MediaPreviousTrack',
		numlock: 'Numlock',
		pagedown: 'PageDown',
		pageup: 'PageUp',
		printscreen: 'PrintScreen',
		scrolllock: 'Scrolllock',
		tab: 'Tab',

		volumedown: 'VolumeDown',
		volumemute: 'VolumeMute',
		// Media keys
		volumeup: 'VolumeUp',
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
function convertToModifier(
	key: KeyboardEventSupportedKey,
): AcceleratorModifier | null {
	const platform = os.type();

	switch (key) {
		case 'alt':
			// Alt key is called "Option" on macOS in Electron accelerators
			return platform === 'macos' ? 'Option' : 'Alt';

		case 'altgraph':
			// AltGr is not available on macOS
			return platform === 'macos' ? null : 'AltGr';

		case 'control':
			// Control key is consistent across all platforms
			return 'Control';

		case 'fn':
			// These are not supported as Electron accelerator modifiers
			return null;

		case 'meta':
			// Meta key maps differently based on platform:
			// - macOS: Command key (reported as "meta" by browser)
			// - Windows/Linux: Windows/Super key (reported as "meta" by browser)
			return platform === 'macos' ? 'Command' : 'Super';

		case 'shift':
			// Shift key is consistent across all platforms
			return 'Shift';

		// These keys might be reported by browsers but aren't standard Electron modifiers
		case 'super':
			// "super" as a key value (different from Meta) maps to Super modifier
			return 'Super';

		default:
			// Any other key is not a modifier
			return null;
	}
}

/**
 * Sort modifiers in a standard order for consistency
 * Order: CommandOrControl/Ctrl, Alt, Shift, Meta (if separate)
 */
function sortModifiers(
	modifiers: AcceleratorModifier[],
): AcceleratorModifier[] {
	const order: Record<AcceleratorModifier, number> = {
		Alt: 2,
		AltGr: 3,
		Cmd: 1,
		Command: 1,
		Control: 1,
		Ctrl: 1,
		Meta: 5,
		Option: 2,
		Shift: 4,
		Super: 5,
	};

	return modifiers.sort((a, b) => {
		const orderA = order[a] || 99;
		const orderB = order[b] || 99;
		return orderA - orderB;
	});
}

export const GlobalShortcutManagerLive = createGlobalShortcutManager();
