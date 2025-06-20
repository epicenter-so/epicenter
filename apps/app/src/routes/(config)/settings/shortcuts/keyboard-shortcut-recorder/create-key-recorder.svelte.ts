import type { PressedKeys } from '$lib/utils/createPressedKeys.svelte';

const CAPTURE_WINDOW_MS = 300; // Time to wait for additional keys
const MIN_KEY_HOLD_MS = 20; // Minimum time a key needs to be held to register

/**
 * Creates a keyboard shortcut recorder with state management and event handling
 *
 * Uses a "capture window" approach:
 * - Keys are captured immediately when pressed (no waiting)
 * - The capture window extends each time a new key is added
 * - Combination completes when window expires OR all keys are released
 * - This allows both quick taps and held combinations to work smoothly
 */
export function createKeyRecorder({
	pressedKeys,
	onRegister,
	onClear,
}: {
	pressedKeys: PressedKeys;
	onRegister: (keyCombination: string[]) => void;
	onClear: () => void | Promise<void>;
}) {
	let isListening = $state(false);
	const capturedKeys: Set<string> = new Set();
	const keyPressTimestamps: Map<string, number> = new Map();

	let captureWindowTimeout: NodeJS.Timeout | null = null;
	let allKeysReleasedTimeout: NodeJS.Timeout | null = null;

	function clearTimeouts() {
		if (captureWindowTimeout) {
			clearTimeout(captureWindowTimeout);
			captureWindowTimeout = null;
		}
		if (allKeysReleasedTimeout) {
			clearTimeout(allKeysReleasedTimeout);
			allKeysReleasedTimeout = null;
		}
	}

	function completeCombination() {
		if (!isListening || capturedKeys.size === 0) return;

		clearTimeouts();

		// Filter out keys that were just tapped too briefly
		const now = Date.now();
		const validKeys = Array.from(capturedKeys).filter((key) => {
			const pressTime = keyPressTimestamps.get(key);
			return (
				pressTime &&
				(now - pressTime >= MIN_KEY_HOLD_MS ||
					pressedKeys.current.includes(key))
			);
		});

		if (validKeys.length > 0) {
			isListening = false;
			onRegister(validKeys);
		}

		capturedKeys.clear();
		keyPressTimestamps.clear();
	}

	$effect(() => {
		if (!isListening) return;

		// Handle escape key
		if (pressedKeys.current.includes('escape')) {
			isListening = false;
			clearTimeouts();
			capturedKeys.clear();
			keyPressTimestamps.clear();
			return;
		}

		// Add any new keys to our captured set
		const now = Date.now();
		let hasNewKeys = false;

		for (const key of pressedKeys.current) {
			if (!capturedKeys.has(key)) {
				capturedKeys.add(key);
				keyPressTimestamps.set(key, now);
				hasNewKeys = true;
			}
		}

		// If we have new keys, reset the capture window
		if (hasNewKeys && capturedKeys.size > 0) {
			clearTimeouts();

			// Set a new capture window timeout
			captureWindowTimeout = setTimeout(() => {
				completeCombination();
			}, CAPTURE_WINDOW_MS);
		}

		// If all keys are released, complete after a short delay
		if (pressedKeys.current.length === 0 && capturedKeys.size > 0) {
			if (!allKeysReleasedTimeout) {
				allKeysReleasedTimeout = setTimeout(() => {
					completeCombination();
				}, 50); // Small delay to catch very quick key sequences
			}
		}
	});

	return {
		get isListening() {
			return isListening;
		},
		start() {
			isListening = true;
			capturedKeys.clear();
			keyPressTimestamps.clear();
			clearTimeouts();
		},
		stop() {
			isListening = false;
			capturedKeys.clear();
			keyPressTimestamps.clear();
			clearTimeouts();
		},
		async clear() {
			isListening = false;
			capturedKeys.clear();
			keyPressTimestamps.clear();
			clearTimeouts();
			await onClear();
		},
		register: onRegister,
	};
}

export type KeyRecorder = ReturnType<typeof createKeyRecorder>;
