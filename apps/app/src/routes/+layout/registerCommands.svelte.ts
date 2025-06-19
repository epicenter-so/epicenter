import { commands } from '$lib/commands';
import { rpc } from '$lib/query';
import { shortcutStringToArray } from '$lib/services/shortcuts/formatConverters';
import { settings } from '$lib/stores/settings.svelte';
import { partitionResults } from '@epicenterhq/result';
import { toast } from '$lib/toast';

export function registerLocalCommands() {
	$effect(() => {
		(async () => {
			const results = await Promise.all(
				commands
					.map((command) => {
						const keyCombination =
							settings.value[`shortcuts.local.${command.id}`];
						if (!keyCombination) {
							return rpc.shortcuts.unregisterCommandLocally.execute({
								commandId: command.id,
							});
						}
						return rpc.shortcuts.registerCommandLocally.execute({
							command,
							keyCombination: shortcutStringToArray(keyCombination),
						});
					})
					.filter((result) => result !== undefined),
			);
			const { errs } = partitionResults(results);
			if (errs.length > 0) {
				toast.error({
					title: 'Error registering local commands',
					description: errs.map((err) => err.error.message).join('\n'),
					action: { type: 'more-details', error: errs },
				});
			}
		})();
	});
}

export function registerGlobalCommands() {
	$effect(() => {
		(async () => {
			const results = await Promise.all(
				commands
					.map((command) => {
						const keyCombination =
							settings.value[`shortcuts.global.${command.id}`];
						if (!keyCombination) {
							return rpc.shortcuts.unregisterCommandGlobally.execute({
								commandId: command.id,
							});
						}
						return rpc.shortcuts.registerCommandGlobally.execute({
							command,
							keyCombination,
						});
					})
					.filter((result) => result !== undefined),
			);
			const { errs } = partitionResults(results);
			if (errs.length > 0) {
				toast.error({
					title: 'Error registering global commands',
					description: errs.map((err) => err.error.message).join('\n'),
					action: { type: 'more-details', error: errs },
				});
			}
		})();
	});
}
