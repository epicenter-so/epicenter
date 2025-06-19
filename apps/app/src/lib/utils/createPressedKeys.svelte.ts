import { on } from 'svelte/events';
import { createSubscriber } from 'svelte/reactivity';

/**
 * Creates a reactive state manager for tracking pressed keyboard keys.
 *
 * Features:
 * - Tracks currently pressed keys in lowercase format
 * - Prevents duplicate keys in the pressed state
 * - Handles special cases for modifier keys (meta, control, alt, shift)
 * - Clears pressed keys on window blur and tab visibility changes
 * - Automatically manages event listener cleanup
 *
 * @returns An object with a `current` getter that returns the array of currently pressed keys
 *
 * @example
 * ```ts
 * const pressedKeys = createPressedKeys();
 *
 * // In a reactive context
 * $effect(() => {
 *   console.log('Currently pressed:', pressedKeys.current);
 * });
 * ```
 */
export function createPressedKeys() {
	/**
	 * Pressed and normalized keys, internally stored and synced via createSubscriber.
	 */
	let pressedKeys = $state<string[]>([]);

	const subscribe = createSubscriber((update) => {
		const keydown = on(window, 'keydown', (e) => {
			const key = e.key.toLowerCase();
			if (!pressedKeys.includes(key)) {
				pressedKeys.push(key);
			}
			update();
		});

		const keyup = on(window, 'keyup', (e) => {
			const key = e.key.toLowerCase();

			// Special handling for modifier keys (meta, control, alt, shift)
			// This addresses issues with OS/browser intercepting certain key combinations
			// where non-modifier keyup events might not fire properly
			if (['meta', 'control', 'alt', 'shift'].includes(key)) {
				// When a modifier key is released, clear all non-modifier keys
				// but keep other modifier keys that might still be pressedKeys
				// This prevents keys from getting "stuck" in the pressedKeys state
				pressedKeys = pressedKeys.filter((k) =>
					['meta', 'control', 'alt', 'shift'].includes(k),
				);
			}

			// Regular key removal
			pressedKeys = pressedKeys.filter((k) => k !== key);
			update();
		});

		// Handle window blur events (switching applications, clicking outside browser)
		// Reset all keys when user shifts focus away from the window
		const blur = on(window, 'blur', () => {
			pressedKeys = [];
			update();
		});

		// Handle tab visibility changes (switching browser tabs)
		// This catches cases where the window doesn't lose focus but the tab is hidden
		const visibilityChange = on(document, 'visibilitychange', () => {
			if (document.visibilityState === 'hidden') {
				pressedKeys = [];
				update();
			}
		});

		return () => {
			keydown();
			keyup();
			blur();
			visibilityChange();
		};
	});

	return {
		get current() {
			subscribe();
			return pressedKeys;
		},
	};
}

export type PressedKeys = ReturnType<typeof createPressedKeys>;
