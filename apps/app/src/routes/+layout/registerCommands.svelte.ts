import { commands, type CommandId } from '$lib/commands';
import { rpc } from '$lib/query';
import { shortcutStringToArray } from '$lib/services/shortcuts/formatConverters';
import { settings } from '$lib/stores/settings.svelte';
import { partitionResults } from '@epicenterhq/result';
import { toast } from '$lib/toast';
import type { Accelerator } from '$lib/services/shortcuts/createGlobalShortcutManager';
import { onMount } from 'svelte';

/**
 * Sets up local keyboard shortcuts synchronization when the component mounts.
 * This ensures shortcuts are registered/unregistered based on current settings.
 */
export function setupLocalShortcutsOnMount() {
	onMount(syncLocalShortcutsWithSettings);
}

/**
 * Synchronizes local keyboard shortcuts with the current settings.
 * - Registers shortcuts that have key combinations defined in settings
 * - Unregisters shortcuts that don't have key combinations defined
 * - Shows error toast if any registration/unregistration fails
 */
export async function syncLocalShortcutsWithSettings() {
	const results = await Promise.all(
		commands
			.map((command) => {
				const keyCombination = settings.value[`shortcuts.local.${command.id}`];
				if (!keyCombination) {
					return rpc.shortcuts.unregisterCommandLocally.execute({
						commandId: command.id as CommandId,
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
}

/**
 * Sets up global keyboard shortcuts synchronization when the component mounts.
 * This ensures shortcuts are registered/unregistered based on current settings.
 */
export function setupGlobalShortcutsOnMount() {
	onMount(syncGlobalShortcutsWithSettings);
}

/**
 * Synchronizes global keyboard shortcuts with the current settings.
 * - Registers shortcuts that have key combinations defined in settings
 * - Unregisters shortcuts that don't have key combinations defined
 * - Shows error toast if any registration/unregistration fails
 */
export async function syncGlobalShortcutsWithSettings() {
	const results = await Promise.all(
		commands
			.map((command) => {
				const keyCombination = settings.value[`shortcuts.global.${command.id}`];
				if (!keyCombination) {
					return rpc.shortcuts.unregisterCommandGlobally.execute({
						commandId: command.id as CommandId,
					});
				}
				return rpc.shortcuts.registerCommandGlobally.execute({
					command,
					keyCombination: keyCombination as Accelerator,
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
}
