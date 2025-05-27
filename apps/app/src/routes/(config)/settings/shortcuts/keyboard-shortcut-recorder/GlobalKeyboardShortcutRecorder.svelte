<script lang="ts">
	import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { tryAsync } from '@epicenterhq/result';
	import { type Command, WhisperingError } from '@repo/shared';
	import { createKeyRecorder } from './index.svelte';
	import { createGlobalKeyMapper } from './key-mappers';
	import KeyboardShortcutRecorder from './KeyboardShortcutRecorder.svelte';

	const {
		command,
		placeholder,
		autoFocus = false,
	}: {
		command: Command;
		placeholder?: string;
		autoFocus?: boolean;
	} = $props();

	const shortcutsRegister = getShortcutsRegisterFromContext();
	let isPopoverOpen = $state(false);

	// Get the current key combination from settings
	const keyCombination = $derived(
		settings.value[`shortcuts.global.${command.id}`],
	);

	// Create a key mapper for global shortcuts
	const keyMapper = createGlobalKeyMapper();

	// Create the key recorder with callbacks
	const keyRecorder = createKeyRecorder(
		{
			onUnregister: async () => {
				const oldShortcutKey = settings.value[`shortcuts.global.${command.id}`];
				if (!oldShortcutKey) return;

				const { error: unregisterError } = await tryAsync({
					try: async () => {
						if (!window.__TAURI_INTERNALS__) return;
						const { unregister } = await import(
							'@tauri-apps/plugin-global-shortcut'
						);
						return await unregister(oldShortcutKey);
					},
					mapErr: (error) =>
						WhisperingError({
							title: `Error unregistering command with id ${command.id} globally`,
							description: 'Please try again.',
							action: { type: 'more-details', error },
						}),
				});

				if (unregisterError) {
					toast.error(unregisterError);
				}
			},
			onRegister: async (keyCombination) => {
				const { error: registerError } =
					await shortcutsRegister.registerCommandGlobally({
						command,
						keyCombination,
					});

				if (registerError) {
					toast.error(registerError);
					return;
				}

				settings.value = {
					...settings.value,
					[`shortcuts.global.${command.id}`]: keyCombination,
				};

				toast.success({
					title: `Global shortcut set to ${keyCombination}`,
					description: `Press the shortcut to trigger "${command.title}"`,
				});

				isPopoverOpen = false;
			},
			onClear: async () => {
				settings.value = {
					...settings.value,
					[`shortcuts.global.${command.id}`]: null,
				};

				toast.success({
					title: 'Global shortcut cleared',
					description: `Please set a new shortcut to trigger "${command.title}"`,
				});

				isPopoverOpen = false;
			},
			onEscape: () => {
				isPopoverOpen = false;
			},
		},
		{ mapKeyboardEvent: keyMapper.mapKeyboardEvent },
	);

	// Handle popover open/close
	function handleOpenChange(isOpen: boolean) {
		isPopoverOpen = isOpen;
		if (!isOpen) keyRecorder.stop();
	}
</script>

<KeyboardShortcutRecorder
	{command}
	{placeholder}
	{autoFocus}
	{keyCombination}
	isListening={keyRecorder.isListening}
	onOpenChange={handleOpenChange}
	onStartListening={() => keyRecorder.start()}
	onClear={() => keyRecorder.clear()}
/>
