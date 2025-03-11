import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
import { settings } from '$lib/stores/settings.svelte';
import { commands } from '@repo/shared';
import { onMount } from 'svelte';

export function bindKeyboardShortcutsOnLoad() {
	const shortcutsRegister = getShortcutsRegisterFromContext();

	onMount(async () => {
		for (const command of commands) {
			shortcutsRegister.registerCommandLocally({
				command,
				shortcutKey: settings.value[`shortcuts.local.${command.id}`],
				onSuccess: () => {},
				onError: () => {},
			});
		}

		await Promise.all(
			commands.map((command) =>
				shortcutsRegister.registerCommandGlobally({
					command,
					shortcutKey: settings.value[`shortcuts.global.${command.id}`],
					onSuccess: () => {},
					onError: () => {},
				}),
			),
		);
	});
}
