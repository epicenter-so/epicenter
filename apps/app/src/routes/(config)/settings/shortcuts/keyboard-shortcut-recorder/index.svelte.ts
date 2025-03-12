export { default as LocalShortcutTable } from './LocalShortcutTable.svelte';
export { default as GlobalShortcutTable } from './GlobalShortcutTable.svelte';

export function createKeyRecorder({
	mapKeyboardEventToKeyCombination,
	onKeyCombinationRecorded,
	onEscape,
}: {
	mapKeyboardEventToKeyCombination: (event: KeyboardEvent) => string | null;
	onKeyCombinationRecorded: (keyCombination: string) => void;
	onEscape?: () => void;
}) {
	/** Internal state keeping track of the keys pressed as a string */
	let keyCombination = $state<string | null>(null);

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
		keyCombination = maybeValidKeyCombination;
		onKeyCombinationRecorded(keyCombination);
		stopListening();
	};

	$effect(() => {
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	return {
		get keyCombination() {
			return keyCombination;
		},
		get isListening() {
			return isListening;
		},
		startListening,
		stopListening,
		clear() {
			keyCombination = null;
			stopListening();
		},
	};
}
