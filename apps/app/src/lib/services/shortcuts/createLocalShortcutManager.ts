import { Ok, type Result, type TaggedError } from '@epicenterhq/result';
import { on } from 'svelte/events';
import type { ShortcutTriggerState } from './shortcut-trigger-state';

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

export function createLocalShortcutManager() {
	const shortcuts = new Map<
		string,
		{
			on: ShortcutTriggerState;
			keyCombination: string[];
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
			/** Array tracking currently pressed keys in lowercase format */
			let pressedKeys: string[] = [];
			/** Set tracking which shortcuts are currently active (held down) */
			const activeShortcuts = new Set<string>();

			/** Handle keydown events - adds keys to pressed state and triggers 'Pressed' shortcuts */
			const keydown = on(window, 'keydown', (e) => {
				const key = e.key.toLowerCase();
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
					if (!activeShortcuts.has(id) && (on === 'Both' || on === 'Pressed')) {
						activeShortcuts.add(id);
						callback();
					}
				}
			});

			/** Handle keyup events - removes keys from pressed state and triggers 'Released' shortcuts */
			const keyup = on(window, 'keyup', (e) => {
				const key = e.key.toLowerCase();
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
			id: string;
			keyCombination: string[];
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
			id: string,
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

export type LocalShortcutManager = ReturnType<
	typeof createLocalShortcutManager
>;

/**
 * Check if two arrays match, order does not matter
 * @param a - The first array
 * @param b - The second array
 * @returns true if the arrays match, false otherwise
 */
export function arraysMatch(a: string[], b: string[]) {
	return a.length === b.length && a.every((key) => b.includes(key));
}
