export { default as KeyboardShortcutRecorder } from './KeyboardShortcutRecorder.svelte';

export function createKeyRecorder({
	getKeys,
	onKeysRecorded,
	onEscape,
}: {
	getKeys: (event: KeyboardEvent) => string[] | null;
	onKeysRecorded: (keys: string[]) => void;
	onEscape?: () => void;
}) {
	/** Internal state keeping track of the keys pressed as an array */
	let keys = $state<string[]>([]);

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

		const maybeKeys = getKeys(event);
		if (!maybeKeys) return;
		keys = maybeKeys;
		onKeysRecorded(keys);
		stopListening();
	};

	$effect(() => {
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	return {
		get keys() {
			return keys;
		},
		get isListening() {
			return isListening;
		},
		startListening,
		stopListening,
		clear() {
			keys = [];
			onKeysRecorded([]);
			stopListening();
		},
	};
}
