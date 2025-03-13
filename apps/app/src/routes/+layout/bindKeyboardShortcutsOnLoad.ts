import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
import { settings } from '$lib/stores/settings.svelte';
import { commands } from '@repo/shared';
import { onMount } from 'svelte';

export function bindKeyboardShortcutsOnLoad() {
	const shortcutsRegister = getShortcutsRegisterFromContext();

	onMount(async () => {
		for (const command of commands) {
			const keyCombination = settings.value[`shortcuts.local.${command.id}`];
			if (!keyCombination) continue;
			shortcutsRegister.registerCommandLocally({ command, keyCombination });
		}

		await Promise.all(
			commands.map((command) => {
				const keyCombination = settings.value[`shortcuts.global.${command.id}`];
				if (!keyCombination) return;
				return shortcutsRegister.registerCommandGlobally({
					command,
					keyCombination,
				});
			}),
		);
	});
}
