import { Ok, type Result, type TaggedError } from '@epicenterhq/result';
import { on } from 'svelte/events';
import type { ShortcutTriggerState } from './shortcut-trigger-state';

type LocalShortcutServiceError = TaggedError<'LocalShortcutServiceError'>;

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
			/** Set tracking which shortcuts have already been triggered during current key press session */
			const triggeredShortcuts = new Set<string>();

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
					if (
						arraysMatch(pressedKeys, keyCombination) &&
						(on === 'Both' || on === 'Pressed') &&
						!triggeredShortcuts.has(id)
					) {
						e.preventDefault();
						triggeredShortcuts.add(id);
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
					triggeredShortcuts.clear();
				}

				// Regular key removal from pressed state
				pressedKeys = pressedKeys.filter((k) => k !== key);

				// Check all registered shortcuts for matches on release
				for (const [
					,
					{ callback, keyCombination, on },
				] of shortcuts.entries()) {
					if (
						arraysMatch(pressedKeys, keyCombination) &&
						(on === 'Both' || on === 'Released')
					) {
						e.preventDefault();
						callback();
					}
				}

				// Clear triggered shortcuts when no keys are pressed
				if (pressedKeys.length === 0) {
					triggeredShortcuts.clear();
				}
			});

			/**
			 * Handle window blur events (switching applications, clicking outside browser)
			 * Reset all keys when user shifts focus away from the window
			 */
			const blur = on(window, 'blur', () => {
				pressedKeys = [];
				triggeredShortcuts.clear();
			});

			/**
			 * Handle tab visibility changes (switching browser tabs)
			 * This catches cases where the window doesn't lose focus but the tab is hidden
			 */
			const visibilityChange = on(document, 'visibilitychange', () => {
				if (document.visibilityState === 'hidden') {
					pressedKeys = [];
					triggeredShortcuts.clear();
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

		async unregister(
			id: string,
		): Promise<Result<void, LocalShortcutServiceError>> {
			shortcuts.delete(id);
			return Ok(undefined);
		},

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
function arraysMatch(a: string[], b: string[]) {
	return a.length === b.length && a.every((key) => b.includes(key));
}
