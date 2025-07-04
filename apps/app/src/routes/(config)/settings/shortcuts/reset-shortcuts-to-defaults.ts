import { commands } from '$lib/commands';
import type { Settings } from '$lib/settings';
import { settings } from '$lib/stores/settings.svelte';
import {
	syncGlobalShortcutsWithSettings,
	syncLocalShortcutsWithSettings,
} from '../../../+layout/register-commands';

export function resetShortcutsToDefaults(type: 'local' | 'global') {
	const updates = commands.reduce(
		(acc, command) => {
			acc[`shortcuts.${type}.${command.id}`] =
				type === 'local'
					? command.defaultLocalShortcut
					: command.defaultGlobalShortcut;
			return acc;
		},
		{} as Partial<Settings>,
	);

	settings.value = {
		...settings.value,
		...updates,
	};

	switch (type) {
		case 'local':
			syncLocalShortcutsWithSettings();
			break;
		case 'global':
			syncGlobalShortcutsWithSettings();
			break;
	}
}
