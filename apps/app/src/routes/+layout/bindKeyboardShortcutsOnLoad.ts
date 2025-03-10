import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
import { settings } from '$lib/stores/settings.svelte';
import { commandIds } from '@repo/shared/settings';
import { onMount } from 'svelte';

export function bindKeyboardShortcutsOnLoad() {
	const shortcutsRegister = getShortcutsRegisterFromContext();

	onMount(async () => {
		for (const commandId of commandIds) {
			shortcutsRegister.registerCommandLocally({
				commandId: commandId,
				shortcutKey: settings.value[`shortcuts.local.${commandId}`],
				onSuccess: () => {},
				onError: () => {},
			});
		}

		await Promise.all(
			commandIds.map((commandId) =>
				shortcutsRegister.registerCommandGlobally({
					commandId: commandId,
					shortcutKey: settings.value[`shortcuts.global.${commandId}`],
					onSuccess: () => {},
					onError: () => {},
				}),
			),
		);
	});
}
