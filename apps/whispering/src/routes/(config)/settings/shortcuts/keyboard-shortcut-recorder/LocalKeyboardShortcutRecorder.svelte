<script lang="ts">
	import type { Command } from '$lib/commands';
	import type { KeyboardEventSupportedKey } from '$lib/constants/keyboard';

	import { rpc } from '$lib/query';
	import {
		arrayToShortcutString,
		type CommandId,
	} from '$lib/services/local-shortcut-manager';
	import { settings } from '$lib/stores/settings.svelte';
	import { type PressedKeys } from '$lib/utils/createPressedKeys.svelte';

	import { createKeyRecorder } from './create-key-recorder.svelte';
	import KeyboardShortcutRecorder from './KeyboardShortcutRecorder.svelte';

	const {
		autoFocus = true,
		command,
		placeholder,
		pressedKeys,
	}: {
		autoFocus?: boolean;
		command: Command;
		placeholder?: string;
		pressedKeys: PressedKeys;
	} = $props();

	const shortcutValue = $derived(
		settings.value[`shortcuts.local.${command.id}`],
	);

	const keyRecorder = createKeyRecorder({
		onClear: async () => {
			const { error: unregisterError } =
				await rpc.shortcuts.unregisterCommandLocally.execute({
					commandId: command.id as CommandId,
				});
			if (unregisterError) {
				rpc.notify.error.execute({
					title: 'Error clearing local shortcut',
					description: unregisterError.message,
					action: { error: unregisterError, type: 'more-details' },
				});
			}
			settings.updateKey(`shortcuts.local.${command.id}`, null);

			rpc.notify.success.execute({
				title: 'Local shortcut cleared',
				description: `Please set a new shortcut to trigger "${command.title}"`,
			});
		},
		onRegister: async (keyCombination: KeyboardEventSupportedKey[]) => {
			const { error: unregisterError } =
				await rpc.shortcuts.unregisterCommandLocally.execute({
					commandId: command.id as CommandId,
				});
			if (unregisterError) {
				rpc.notify.error.execute({
					title: 'Error unregistering local shortcut',
					description: unregisterError.message,
					action: { error: unregisterError, type: 'more-details' },
				});
			}
			const { error: registerError } =
				await rpc.shortcuts.registerCommandLocally.execute({
					command,
					keyCombination,
				});

			if (registerError) {
				rpc.notify.error.execute({
					title: 'Error registering local shortcut',
					description: registerError.message,
					action: { error: registerError, type: 'more-details' },
				});
				return;
			}

			settings.updateKey(`shortcuts.local.${command.id}`, arrayToShortcutString(keyCombination));

			rpc.notify.success.execute({
				title: `Local shortcut set to ${keyCombination}`,
				description: `Press the shortcut to trigger "${command.title}"`,
			});
		},
		pressedKeys,
	});
</script>

<KeyboardShortcutRecorder
	title={command.title}
	{placeholder}
	{autoFocus}
	rawKeyCombination={shortcutValue}
	{keyRecorder}
/>
