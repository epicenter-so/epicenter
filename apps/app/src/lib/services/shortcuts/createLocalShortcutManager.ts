import type { Brand } from '$lib/brand';
import type { CommandId } from '$lib/commands';
import { Ok, type Result, type TaggedError } from '@epicenterhq/result';
import { on } from 'svelte/events';
import type { ShortcutTriggerState } from './shortcut-trigger-state';
import { ALL_SUPPORTED_KEYS, type SupportedKey } from '@repo/shared/keyboard';

/**
 * Error type for local shortcut service operations.
 * This error is returned when shortcut registration, unregistration, or other
 * local shortcut operations fail. Uses a tagged error pattern for type safety
 * and better error discrimination in Result types.
 */
type LocalShortcutServiceError = TaggedError<'LocalShortcutServiceError'>;

/**
 * Comprehensive list of all possible values that can be returned by `e.key.toLowerCase()`
 * This includes printable characters, special keys, navigation keys, function keys, etc.
 * Used for validation and type safety in keyboard event handling.
 */
export const POSSIBLE_KEY_VALUES = [
	// Letters (lowercase)
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

	// Numbers
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

	// Symbols and punctuation (these remain the same with toLowerCase())
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

	// Whitespace
	' ', // Space
	'enter',
	'tab',

	// Navigation keys (lowercase)
	'arrowleft',
	'arrowright',
	'arrowup',
	'arrowdown',
	'home',
	'end',
	'pageup',
	'pagedown',

	// Editing keys (lowercase)
	'backspace',
	'delete',
	'insert',
	'clear',
	'copy',
	'cut',
	'paste',
	'redo',
	'undo',

	// Function keys (lowercase)
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

	// Modifier keys (lowercase)
	'control',
	'shift',
	'alt',
	'meta', // meta is Command on Mac, Windows key on PC
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

	// Special keys (lowercase)
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

	// Media keys (lowercase)
	'mediaplaypause',
	'mediaplay',
	'mediapause',
	'mediastop',
	'mediatracknext',
	'mediatrackprevious',
	'volumeup',
	'volumedown',
	'volumemute',

	// Other special values
	'dead', // Dead keys for creating accented characters
	'unidentified', // When the key cannot be identified
	'process', // IME processing
	'compose', // Compose key
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

	// Soft keys (mobile/special keyboards)
	'soft1',
	'soft2',
	'soft3',
	'soft4',

	// Additional editing keys
	'crsel',
	'exsel',
	'eraseof',

	// Audio/launch keys
	'launchapplication1',
	'launchapplication2',
	'launchmail',
	'launchmediacenter',

	// Asian language input keys
	'alphanumeric',
	'codeinput',
	'convert',
	'finalmode',
	'groupfirst',
	'grouplast',
	'groupnext',
	'groupprevious',
	'modechange',
	'nextcandidate',
	'nonconvert',
	'previouscandidate',
	'singlecandidate',

	// Additional keys
	'allcandidates',
	'hankaku',
	'hiragana',
	'hiraganakatakana',
	'junja',
	'kanamode',
	'kanjimode',
	'katakana',
	'romaji',
	'zenkaku',
	'zenkakuhankaku',
] as const;

/**
 * Union type representing all possible keyboard key values that can be
 * returned by `KeyboardEvent.key.toLowerCase()`. This comprehensive type
 * includes all standard keyboard keys across different platforms and layouts:
 * - Printable characters (letters, numbers, symbols)
 * - Navigation and editing keys
 * - Function and modifier keys
 * - Media control and special system keys
 * - International/IME keys for various languages
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values MDN Keyboard Event Key Values}
 */
export type PossibleKey = (typeof POSSIBLE_KEY_VALUES)[number];

/**
 * Type guard that validates whether a PossibleKey (any key from the browser)
 * is one of our chosen SupportedKeys. This function acts as a gatekeeper,
 * filtering out keys we've decided not to support while providing type safety.
 *
 * When this returns true, TypeScript narrows the type from PossibleKey to
 * SupportedKey, giving you compile-time guarantees about the key's validity.
 *
 * @param key - Any key value from KeyboardEvent.key.toLowerCase()
 * @returns True if we've chosen to support this key for shortcuts, false otherwise
 *
 * @example
 * ```typescript
 * const key = e.key.toLowerCase() as PossibleKey;
 * if (isSupportedKey(key)) {
 *   // TypeScript now knows this is a SupportedKey - our validated choice!
 *   pressedKeys.push(key);
 * }
 * ```
 */
export function isSupportedKey(key: PossibleKey): key is SupportedKey {
	return ALL_SUPPORTED_KEYS.includes(key as SupportedKey);
}

export function createLocalShortcutManager() {
	const shortcuts = new Map<
		CommandId,
		{
			on: ShortcutTriggerState;
			keyCombination: SupportedKey[];
			callback: () => void;
		}
	>();

	return {
		/**
		 * Sets up keyboard event listeners to detect and handle shortcut key combinations.
		 *
		 * - Tracks currently pressed keys in real-time
		 * - Matches key combinations against registered shortcuts
		 * - Handles both keydown and keyup events for flexible trigger options
		 * - Provides special handling for modifier keys to prevent stuck keys
		 * - Automatically cleans up state when window loses focus or visibility
		 *
		 * @returns Cleanup function that removes all event listeners when called
		 */
		listen() {
			/**
			 * Array tracking currently pressed keys in lowercase format.
			 * Maintains real-time state of which keys are physically held down.
			 * Updated on every keydown (adds key) and keyup (removes key) event.
			 */
			let pressedKeys: SupportedKey[] = [];
			/**
			 * Set tracking which shortcuts have already been triggered and are currently active.
			 * This prevents key repeat spam when holding down keys - without this, holding
			 * spacebar would trigger the shortcut many times per second!
			 *
			 * When a shortcut is triggered:
			 * 1. Its ID is added to this set, marking it as "already fired"
			 * 2. Future keydown events with the same key combo are ignored
			 * 3. The ID is only removed when all keys are released or focus is lost
			 *
			 * This ensures each key combination fires exactly once per physical press,
			 * regardless of how long the user holds the keys down.
			 */
			const activeShortcuts = new Set<CommandId>();

			/**
			 * Handle keydown events - adds keys to pressed state and triggers 'Pressed' shortcuts.
			 * Fires repeatedly while a key is held down (due to OS key repeat), but activeShortcuts
			 * ensures callbacks only fire once per physical key press.
			 */
			const keydown = on(window, 'keydown', (e) => {
				const key = e.key.toLowerCase() as PossibleKey;

				// Ignore keys that are not supported
				if (!isSupportedKey(key)) return;

				// Add key to pressed state if not already present
				if (!pressedKeys.includes(key)) pressedKeys.push(key);

				// Check all registered shortcuts for matches
				for (const [
					id,
					{ callback, keyCombination, on },
				] of shortcuts.entries()) {
					if (!arraysMatch(pressedKeys, keyCombination)) continue;

					// Always prevent default for matching shortcuts
					e.preventDefault();

					// Only trigger callback if shortcut not already active
					// This is the key anti-spam mechanism: if the shortcut ID is already
					// in activeShortcuts, we know it's been triggered and should not fire again
					if (!activeShortcuts.has(id) && (on === 'Both' || on === 'Pressed')) {
						activeShortcuts.add(id); // Mark as active BEFORE calling callback
						callback();
					}
				}
			});

			/**
			 * Handle keyup events - removes keys from pressed state and triggers 'Released' shortcuts.
			 * Also responsible for clearing activeShortcuts to allow shortcuts to fire again
			 * on the next key press.
			 */
			const keyup = on(window, 'keyup', (e) => {
				const key = e.key.toLowerCase() as PossibleKey;

				// Ignore keys that are not supported
				if (!isSupportedKey(key)) return;

				/** Modifier keys that require special handling */
				const modifierKeys = ['meta', 'control', 'alt', 'shift'];

				if (modifierKeys.includes(key)) {
					// Special handling for modifier keys (meta, control, alt, shift)
					// This addresses issues with OS/browser intercepting certain key combinations
					// where non-modifier keyup events might not fire properly
					// When a modifier key is released, clear all non-modifier keys
					// but keep other modifier keys that might still be pressed
					// This prevents keys from getting "stuck" in the pressedKeys state
					pressedKeys = pressedKeys.filter((k) => modifierKeys.includes(k));
					activeShortcuts.clear();
				}

				// Check all registered shortcuts for matches on release BEFORE removing the key
				for (const [
					id,
					{ callback, keyCombination, on },
				] of shortcuts.entries()) {
					if (!arraysMatch(pressedKeys, keyCombination)) continue;
					if (activeShortcuts.has(id) && (on === 'Both' || on === 'Released')) {
						e.preventDefault();
						callback();
						activeShortcuts.delete(id);
					}
				}

				// Regular key removal from pressed state
				pressedKeys = pressedKeys.filter((k) => k !== key);

				// Clear active shortcuts when no keys are pressed
				if (pressedKeys.length === 0) {
					activeShortcuts.clear();
				}
			});

			/**
			 * Handle window blur events (switching applications, clicking outside browser)
			 * Reset all keys when user shifts focus away from the window
			 */
			const blur = on(window, 'blur', () => {
				pressedKeys = [];
				activeShortcuts.clear();
			});

			/**
			 * Handle tab visibility changes (switching browser tabs)
			 * This catches cases where the window doesn't lose focus but the tab is hidden
			 */
			const visibilityChange = on(document, 'visibilitychange', () => {
				if (document.visibilityState === 'hidden') {
					pressedKeys = [];
					activeShortcuts.clear();
				}
			});

			/** Cleanup function that removes all event listeners */
			return () => {
				keydown();
				keyup();
				blur();
				visibilityChange();
			};
		},
		async register({
			id,
			keyCombination,
			callback,
			on,
		}: {
			id: CommandId;
			keyCombination: SupportedKey[];
			callback: () => void;
			on: ShortcutTriggerState;
		}): Promise<Result<void, LocalShortcutServiceError>> {
			shortcuts.set(id, { keyCombination, callback, on });
			return Ok(undefined);
		},

		/**
		 * Unregisters a local shortcut by ID.
		 * This function is idempotent - it can be safely called even if the shortcut
		 * with the given ID doesn't exist or has already been unregistered.
		 */
		async unregister(
			id: CommandId,
		): Promise<Result<void, LocalShortcutServiceError>> {
			shortcuts.delete(id);
			return Ok(undefined);
		},

		/**
		 * Unregisters all local shortcuts.
		 * This function is idempotent - it can be safely called even if no shortcuts
		 * are currently registered.
		 */
		async unregisterAll(): Promise<Result<void, LocalShortcutServiceError>> {
			shortcuts.clear();
			return Ok(undefined);
		},
	};
}

/**
 * Type representing the local shortcut manager instance.
 * Provides methods to:
 * - Listen for keyboard events and trigger registered shortcuts
 * - Register new keyboard shortcuts with specific key combinations
 * - Unregister individual shortcuts or all shortcuts at once
 *
 * The manager handles the complexity of tracking pressed keys, matching
 * key combinations, and managing shortcut lifecycles.
 *
 * @see {@link createLocalShortcutManager} Factory function to create instances
 */
export type LocalShortcutManager = ReturnType<
	typeof createLocalShortcutManager
>;

/**
 * Checks if two arrays contain the same elements, regardless of order.
 * Used to match pressed key combinations against registered shortcuts.
 *
 * @param a - First array of keys to compare
 * @param b - Second array of keys to compare
 * @returns True if both arrays contain exactly the same elements (same length and all elements present in both)
 *
 * @example
 * ```typescript
 * arraysMatch(['ctrl', 'a'], ['a', 'ctrl']) // returns true
 * arraysMatch(['ctrl', 'a'], ['ctrl', 'a', 'shift']) // returns false
 * ```
 */
function arraysMatch(a: string[], b: string[]) {
	return a.length === b.length && a.every((key) => b.includes(key));
}
