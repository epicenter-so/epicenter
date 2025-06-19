import { commands } from '$lib/commands';
import { rpc } from '$lib/query';
import { shortcutStringToArray } from '$lib/services/shortcuts';
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
						if (!keyCombination) return;
						return rpc.shortcuts.registerCommandLocally.execute({
							command,
							keyCombination: shortcutStringToArray(keyCombination),
						});
					})
					.filter((result) => result !== undefined),
			);
			const { errs } = partitionResults(results);
			if (errs.length > 0) {
				toast.error(errs[0].error);
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
						if (!keyCombination) return;
						return rpc.shortcuts.registerCommandGlobally.execute({
							command,
							keyCombination,
						});
					})
					.filter((result) => result !== undefined),
			);
			const { errs } = partitionResults(results);
			if (errs.length > 0) {
				toast.error(errs[0].error);
			}
		})();
	});
}
