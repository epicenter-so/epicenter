import type { PressedKeys } from '$lib/utils/createPressedKeys.svelte';
import { Ok, type Result } from '@epicenterhq/result';
import type { WhisperingError } from '@repo/shared';

export function createLocalShortcutManager({
	pressedKeys,
}: {
	pressedKeys: PressedKeys;
}) {
	const shortcuts: {
		id: string;
		keyCombination: string[];
		callback: () => void;
	}[] = [];

	$effect(() => {
		for (const shortcut of shortcuts) {
			const isMatch =
				pressedKeys.current.length === shortcut.keyCombination.length &&
				pressedKeys.current.every((key) =>
					shortcut.keyCombination.includes(key),
				);
			if (isMatch) shortcut.callback();
		}
	});

	return {
		async register(
			id: string,
			keyCombination: string[],
			callback: () => void,
		): Promise<Result<void, WhisperingError>> {
			shortcuts.push({ id, keyCombination, callback });
			return Ok(undefined);
		},

		async unregister(id: string): Promise<Result<void, WhisperingError>> {
			const shortcut = shortcuts.find((shortcut) => shortcut.id === id);
			if (!shortcut) return Ok(undefined);

			shortcuts.splice(shortcuts.indexOf(shortcut), 1);
			return Ok(undefined);
		},

		async unregisterAll(): Promise<Result<void, WhisperingError>> {
			shortcuts.length = 0;
			return Ok(undefined);
		},
	};
}
