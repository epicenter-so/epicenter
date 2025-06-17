import { commands } from '$lib/commands';
import { rpc } from '$lib/query';
import { settings } from '$lib/stores/settings.svelte';

export function registerCommandsOnLoad() {
	$effect(() => {
		Promise.all(
			commands.map((command) => {
				const keyCombination = settings.value[`shortcuts.local.${command.id}`];
				if (!keyCombination) return;
				return rpc.shortcuts.registerCommandLocally.execute({
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
				return rpc.shortcuts.registerCommandGlobally.execute({
					command,
					keyCombination,
				});
			}),
		);
	});
}
