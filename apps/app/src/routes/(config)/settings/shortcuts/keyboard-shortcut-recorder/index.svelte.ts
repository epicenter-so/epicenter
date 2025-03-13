export { default as GlobalShortcutTable } from './GlobalShortcutTable.svelte';
export { default as LocalShortcutTable } from './LocalShortcutTable.svelte';

export type KeyCombination = string;

export function createKeyRecorder({
	mapKeyboardEventToKeyCombination,
	registerKeyCombination,
	unregisterOldKeyCombination,
	clearKeyCombination,
	onEscape,
}: {
	mapKeyboardEventToKeyCombination: (event: KeyboardEvent) => string | null;
	registerKeyCombination: (keyCombination: KeyCombination) => void;
	unregisterOldKeyCombination: () => void;
	clearKeyCombination: () => void;
	onEscape?: () => void;
}) {
	let isListening = $state(false);

	const startListening = () => {
		isListening = true;
	};

	const stopListening = () => {
		isListening = false;
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (!isListening) return;

		event.preventDefault();
		event.stopPropagation();

		if (event.key === 'Escape') {
			stopListening();
			onEscape?.();
			return;
		}

		const maybeValidKeyCombination = mapKeyboardEventToKeyCombination(event);
		if (!maybeValidKeyCombination) return;

		unregisterOldKeyCombination();
		registerKeyCombination(maybeValidKeyCombination);
		stopListening();
	};

	$effect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

	return {
		get isListening() {
			return isListening;
		},
		startListening,
		stopListening,
		clear() {
			unregisterOldKeyCombination();
			clearKeyCombination();
			stopListening();
		},
	};
}
