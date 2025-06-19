import { Ok, type Result, type TaggedError } from '@epicenterhq/result';
import { on } from 'svelte/events';

type LocalShortcutServiceError = TaggedError<'LocalShortcutServiceError'>;

export function createLocalShortcutManager() {
	const shortcuts = new Map<
		string,
		{
			on: 'Pressed' | 'Released' | 'Both';
			keyCombination: string[];
			callback: () => void;
		}
	>();

	return {
		listen() {
			let pressedKeys: string[] = [];
			const isPressedKeyMatchesKeyCombination = (keyCombination: string[]) =>
				pressedKeys.length === keyCombination.length &&
				pressedKeys.every((key) => keyCombination.includes(key));

			const keydown = on(window, 'keydown', (e) => {
				const key = e.key.toLowerCase();
				if (!pressedKeys.includes(key)) pressedKeys.push(key);

				for (const { callback, keyCombination, on } of shortcuts.values()) {
					if (
						isPressedKeyMatchesKeyCombination(keyCombination) &&
						(on === 'Both' || on === 'Pressed')
					) {
						e.preventDefault();
						callback();
					}
				}
			});

			const keyup = on(window, 'keyup', (e) => {
				const key = e.key.toLowerCase();

				if (['meta', 'control', 'alt', 'shift'].includes(key)) {
					// Special handling for modifier keys (meta, control, alt, shift)
					// This addresses issues with OS/browser intercepting certain key combinations
					// where non-modifier keyup events might not fire properly
					// When a modifier key is released, clear all non-modifier keys
					// but keep other modifier keys that might still be pressedKeys
					// This prevents keys from getting "stuck" in the pressedKeys state
					pressedKeys = pressedKeys.filter((k) =>
						['meta', 'control', 'alt', 'shift'].includes(k),
					);
				}

				// Regular key removal
				pressedKeys = pressedKeys.filter((k) => k !== key);

				for (const { callback, keyCombination, on } of shortcuts.values()) {
					if (
						isPressedKeyMatchesKeyCombination(keyCombination) &&
						(on === 'Both' || on === 'Released')
					) {
						e.preventDefault();
						callback();
					}
				}
			});

			// Handle window blur events (switching applications, clicking outside browser)
			// Reset all keys when user shifts focus away from the window
			const blur = on(window, 'blur', () => {
				pressedKeys = [];
			});

			// Handle tab visibility changes (switching browser tabs)
			// This catches cases where the window doesn't lose focus but the tab is hidden
			const visibilityChange = on(document, 'visibilitychange', () => {
				if (document.visibilityState === 'hidden') {
					pressedKeys = [];
				}
			});

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
			on: 'Pressed' | 'Released' | 'PressedAndReleased';
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
