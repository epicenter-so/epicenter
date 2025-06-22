<script lang="ts">
	import type { Command } from '$lib/commands';
	import { rpc } from '$lib/query';
	import {
		arrayToShortcutString,
		type CommandId,
	} from '$lib/services/local-shortcut-manager';
	import type { SupportedKey } from '$lib/services/local-shortcut-manager/supported-key';
	import { settings } from '$lib/stores/settings.svelte';
	import { toast } from '$lib/toast';
	import { type PressedKeys } from '$lib/utils/createPressedKeys.svelte';
	import KeyboardShortcutRecorder from './KeyboardShortcutRecorder.svelte';
	import { createKeyRecorder } from './create-key-recorder.svelte';

	const {
		command,
		placeholder,
		autoFocus = true,
		pressedKeys,
	}: {
		command: Command;
		placeholder?: string;
		autoFocus?: boolean;
		pressedKeys: PressedKeys;
	} = $props();

	const shortcutValue = $derived(
		settings.value[`shortcuts.local.${command.id}`],
	);

	const keyRecorder = createKeyRecorder({
		pressedKeys,
		onRegister: async (keyCombination: SupportedKey[]) => {
			const { error: unregisterError } =
				await rpc.shortcuts.unregisterCommandLocally.execute({
					commandId: command.id as CommandId,
				});
			if (unregisterError) {
				toast.error({
					title: 'Error unregistering local shortcut',
					description: unregisterError.message,
					action: { type: 'more-details', error: unregisterError },
				});
			}
			const { error: registerError } =
				await rpc.shortcuts.registerCommandLocally.execute({
					command,
					keyCombination,
				});

			if (registerError) {
				toast.error({
					title: 'Error registering local shortcut',
					description: registerError.message,
					action: { type: 'more-details', error: registerError },
				});
				return;
			}

			settings.value = {
				...settings.value,
				[`shortcuts.local.${command.id}`]:
					arrayToShortcutString(keyCombination),
			};

			toast.success({
				title: `Local shortcut set to ${keyCombination}`,
				description: `Press the shortcut to trigger "${command.title}"`,
			});
		},
		onClear: async () => {
			const { error: unregisterError } =
				await rpc.shortcuts.unregisterCommandLocally.execute({
					commandId: command.id as CommandId,
				});
			if (unregisterError) {
				toast.error({
					title: 'Error clearing local shortcut',
					description: unregisterError.message,
					action: { type: 'more-details', error: unregisterError },
				});
			}
			settings.value = {
				...settings.value,
				[`shortcuts.local.${command.id}`]: null,
			};

			toast.success({
				title: 'Local shortcut cleared',
				description: `Please set a new shortcut to trigger "${command.title}"`,
			});
		},
	});
</script>

<KeyboardShortcutRecorder
	title={command.title}
	{placeholder}
	{autoFocus}
	rawKeyCombination={shortcutValue}
	{keyRecorder}
/>
