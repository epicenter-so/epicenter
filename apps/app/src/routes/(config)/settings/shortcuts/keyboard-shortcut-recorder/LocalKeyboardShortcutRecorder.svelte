<script lang="ts">
	import type { Command } from '$lib/commands';
	import { rpc } from '$lib/query';
	import { services } from '$lib/services';
	import { settings } from '$lib/stores/settings.svelte';
	import { toast } from '$lib/toast';
	import KeyboardShortcutRecorder from './KeyboardShortcutRecorder.svelte';
	import { createKeyRecorder } from './index.svelte';

	const {
		command,
		placeholder,
		autoFocus = true,
	}: {
		command: Command;
		placeholder?: string;
		autoFocus?: boolean;
	} = $props();

	const keyRecorder = createKeyRecorder({
		onUnregister: async () => {
			const { error: unregisterError } =
				await rpc.shortcuts.unregisterCommandLocally.execute({
					commandId: command.id,
				});

			if (unregisterError) {
				toast.error({
					title: 'Error unregistering local shortcut',
					description: unregisterError.message,
					action: { type: 'more-details', error: unregisterError },
				});
			}
		},
		onRegister: async (keyCombination) => {
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
				[`shortcuts.local.${command.id}`]: keyCombination,
			};

			toast.success({
				title: `Local shortcut set to ${keyCombination}`,
				description: `Press the shortcut to trigger "${command.title}"`,
			});
		},
		onClear: () => {
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
	{command}
	{placeholder}
	{autoFocus}
	keyCombination={settings.value[`shortcuts.local.${command.id}`]}
	isListening={keyRecorder.isListening}
	onOpenChange={(isOpen) => {
		if (!isOpen) keyRecorder.stop();
	}}
	onStartListening={() => keyRecorder.start()}
	onClear={() => keyRecorder.clear()}
	onSetManualCombination={async (keyCombination) => {
		await keyRecorder.callbacks.onUnregister();
		await keyRecorder.callbacks.onRegister(keyCombination);
	}}
/>
