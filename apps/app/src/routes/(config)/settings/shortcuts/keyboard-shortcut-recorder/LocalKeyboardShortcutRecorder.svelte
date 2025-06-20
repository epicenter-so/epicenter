<script lang="ts">
	import type { Command, CommandId } from '$lib/commands';
	import { rpc } from '$lib/query';
	import { arrayToShortcutString } from '$lib/services/shortcuts/formatConverters';
	import { settings } from '$lib/stores/settings.svelte';
	import { toast } from '$lib/toast';
	import KeyboardShortcutRecorder from './KeyboardShortcutRecorder.svelte';

	const {
		command,
		placeholder,
		autoFocus = true,
	}: {
		command: Command;
		placeholder?: string;
		autoFocus?: boolean;
	} = $props();
</script>

<KeyboardShortcutRecorder
	title={command.title}
	{placeholder}
	{autoFocus}
	rawKeyCombination={settings.value[`shortcuts.local.${command.id}`]}
	onRegister={async (keyCombination) => {
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
			[`shortcuts.local.${command.id}`]: arrayToShortcutString(keyCombination),
		};

		toast.success({
			title: `Local shortcut set to ${keyCombination}`,
			description: `Press the shortcut to trigger "${command.title}"`,
		});
	}}
	onClear={async () => {
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
	}}
/>
