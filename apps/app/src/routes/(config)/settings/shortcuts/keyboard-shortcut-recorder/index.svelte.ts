export { default as ShortcutTable } from './ShortcutTable.svelte';
export { default as ShortcutFormatHelp } from './ShortcutFormatHelp.svelte';

export type KeyCombination = string;

/**
 * Creates a keyboard shortcut recorder with state management and event handling
 */
export function createKeyRecorder(
	callbacks: {
		onRegister: (keyCombination: KeyCombination) => void | Promise<void>;
		onUnregister: () => void | Promise<void>;
		onClear: () => void | Promise<void>;
		onEscape?: () => void;
		onPopoverClose?: () => void;
	},
	options: {
		mapKeyboardEvent: (event: KeyboardEvent) => KeyCombination | null;
	},
) {
	let isListening = $state(false);

	const handleKeyDown = async (event: KeyboardEvent) => {
		if (!isListening) return;

		event.preventDefault();
		event.stopPropagation();

		if (event.key === 'Escape') {
			isListening = false;
			callbacks.onEscape?.();
			return;
		}

		const keyCombination = options.mapKeyboardEvent(event);
		if (!keyCombination) return;

		isListening = false;

		await callbacks.onUnregister();
		await callbacks.onRegister(keyCombination);
	};

	$effect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

	return {
		get isListening() {
			return isListening;
		},
		start() {
			isListening = true;
		},
		stop() {
			isListening = false;
		},
		async clear() {
			isListening = false;
			await callbacks.onUnregister();
			await callbacks.onClear();
		},
		callbacks,
	};
}
