import { commands } from '$lib/commands';
import { queries } from '$lib/query';
import { settings } from '$lib/stores/settings.svelte';

export function bindKeyboardShortcutsOnLoad() {
	$effect(() => {
		Promise.all(
			commands.map((command) => {
				const keyCombination = settings.value[`shortcuts.local.${command.id}`];
				if (!keyCombination) return;
				return queries.shortcuts.registerCommandLocally.execute({
					command,
					keyCombination,
				});
			}),
		);
	});

	$effect(() => {
		Promise.all(
			commands.map((command) => {
				const keyCombination = settings.value[`shortcuts.global.${command.id}`];
				if (!keyCombination) return;
				return queries.shortcuts.registerCommandGlobally.execute({
					command,
					keyCombination,
				});
			}),
		);
	});
}
