import { commands } from '$lib/commands';
import { shortcuts } from '$lib/query/shortcuts';
import { settings } from '$lib/stores/settings.svelte';

export function bindKeyboardShortcutsOnLoad() {
	$effect(() => {
		Promise.all(
			commands.map((command) => {
				const keyCombination = settings.value[`shortcuts.local.${command.id}`];
				if (!keyCombination) return;
				return shortcuts.registerCommandLocally.execute({
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
				return shortcuts.registerCommandGlobally.execute({
					command,
					keyCombination,
				});
			}),
		);
	});
}
