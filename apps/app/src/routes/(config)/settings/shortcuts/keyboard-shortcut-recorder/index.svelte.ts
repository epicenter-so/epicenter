import {
	arrayToShortcutString,
	normalizeKey,
} from '$lib/services/shortcuts/formatConverters';
import { PressedKeys } from 'runed';

export { default as ShortcutFormatHelp } from './ShortcutFormatHelp.svelte';
export { default as ShortcutTable } from './ShortcutTable.svelte';

/**
 * Singleton instance of PressedKeys for tracking keyboard state
 * Prefixed with underscore as it's internal to the shortcuts service
 */
const pressedKeys = new PressedKeys();

/**
 * Creates a keyboard shortcut recorder with state management and event handling
 */
export function createKeyRecorder(callbacks: {
	onRegister: (keyCombination: string[]) => void | Promise<void>;
	onUnregister: () => void | Promise<void>;
	onClear: () => void | Promise<void>;
	onEscape?: () => void;
	onPopoverClose?: () => void;
}) {
	let isListening = $state(false);
	let lastRecordedKeys: string[] = [];

	const handleKeyDown = async (event: KeyboardEvent) => {
		if (!isListening) return;

		event.preventDefault();
		event.stopPropagation();

		if (event.key === 'Escape') {
			isListening = false;
			callbacks.onEscape?.();
			return;
		}

		// Get all currently pressed keys and normalize them
		const normalizedKeys = pressedKeys.all.map(normalizeKey);

		// Ensure we have at least one key
		if (normalizedKeys.length === 0) return;

		// Check if keys have changed (to avoid multiple triggers)
		const keysChanged =
			JSON.stringify(normalizedKeys.sort()) !==
			JSON.stringify(lastRecordedKeys.sort());
		if (!keysChanged) return;

		lastRecordedKeys = [...normalizedKeys];

		// Convert to shortcut string
		const keyCombination = arrayToShortcutString(normalizedKeys);

		// For global shortcuts, we'll convert the format in the component
		// This keeps the recorder format-agnostic
		isListening = false;

		await callbacks.onUnregister();
		await callbacks.onRegister(keyCombination);
	};

	const handleKeyUp = () => {
		// Reset when all keys are released
		if (isListening && pressedKeys.all.length === 0) {
			lastRecordedKeys = [];
		}
	};

	$effect(() => {
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
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
