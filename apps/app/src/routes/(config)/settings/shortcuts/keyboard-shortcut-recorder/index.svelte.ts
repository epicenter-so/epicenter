import { arraysMatch } from '$lib/services/shortcuts/createLocalShortcutManager.svelte';
import { createPressedKeys } from '$lib/utils/createPressedKeys.svelte';
import { on } from 'svelte/events';

export { default as ShortcutFormatHelp } from './ShortcutFormatHelp.svelte';
export { default as ShortcutTable } from './ShortcutTable.svelte';

/**
 * Creates a keyboard shortcut recorder with state management and event handling
 */
export function createKeyRecorder(callbacks: {
	onRegister: (keyCombination: string[]) => void | Promise<void>;
	onUnregister: () => void | Promise<void>;
	onClear: () => void | Promise<void>;
}) {
	const pressedKeys = createPressedKeys();

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

		// Normalize all keys

		// Check if keys have changed (to avoid multiple triggers)
		const keysChanged = !arraysMatch(pressedKeys.current, lastRecordedKeys);
		if (!keysChanged) return;

		lastRecordedKeys = [...pressedKeys.current];

		// Only register if we have a valid key combination
		// Wait a tiny bit to ensure all keys in combination are captured
		setTimeout(async () => {
			// Double-check that keys haven't changed and we're still listening
			const finalKeys = pressedKeys.current;
			const finalKeysMatch = arraysMatch(finalKeys, lastRecordedKeys);

			if (!isListening || !finalKeysMatch || finalKeys.length === 0) return;

			// Stop listening before processing
			isListening = false;

			await callbacks.onUnregister();
			await callbacks.onRegister(finalKeys);
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
			await callbacks.onUnregister();
			await callbacks.onClear();
		},
		callbacks,
	};
}
