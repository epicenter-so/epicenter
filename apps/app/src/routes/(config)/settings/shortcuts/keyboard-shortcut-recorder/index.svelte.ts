import { arraysMatch } from '$lib/services/shortcuts/createLocalShortcutManager.svelte';
import type { PressedKeys } from '$lib/utils/createPressedKeys.svelte';
import { on } from 'svelte/events';

export { default as ShortcutFormatHelp } from './ShortcutFormatHelp.svelte';
export { default as ShortcutTable } from './ShortcutTable.svelte';

/**
 * Creates a keyboard shortcut recorder with state management and event handling
 */
export function createKeyRecorder({
	pressedKeys,
	onRegister,
	onClear,
}: {
	pressedKeys: PressedKeys;
	onRegister: (keyCombination: string[]) => void | Promise<void>;
	onClear: () => void | Promise<void>;
}) {
	let isListening = $state(false);
	let lastRecordedKeys: string[] = [];

	// Prevent default browser behavior when recording shortcuts
	$effect(() => {
		const keydown = on(window, 'keydown', (event) => {
			if (isListening) {
				event.preventDefault();
				event.stopPropagation();
			}
		});

		return () => keydown();
	});

	$effect(() => {
		if (!isListening) return;

		// Handle escape key
		if (arraysMatch(pressedKeys.current, ['escape'])) {
			isListening = false;
			return;
		}

		// Ensure we have at least one non-modifier key
		if (pressedKeys.current.length === 0) {
			lastRecordedKeys = [];
			return;
		}

		const isKeysChanged = !arraysMatch(pressedKeys.current, lastRecordedKeys);
		if (!isKeysChanged) return;

		lastRecordedKeys = [...pressedKeys.current];

		// Wait a tiny bit to ensure all keys in combination are captured
		setTimeout(async () => {
			// Double-check that keys haven't changed and we're still listening
			const keysStillMatch = arraysMatch(pressedKeys.current, lastRecordedKeys);

			if (!isListening || !keysStillMatch || pressedKeys.current.length === 0)
				return;

			isListening = false;

			await onRegister(pressedKeys.current);
		}, 50);
	});

	return {
		get isListening() {
			return isListening;
		},
		start() {
			isListening = true;
			lastRecordedKeys = [];
		},
		stop() {
			isListening = false;
			lastRecordedKeys = [];
		},
		async clear() {
			isListening = false;
			lastRecordedKeys = [];
			await onClear();
		},
		register: onRegister,
	};
}
