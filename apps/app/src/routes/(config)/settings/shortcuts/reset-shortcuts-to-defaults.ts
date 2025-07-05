import { commands } from '$lib/commands';
import type { Settings } from '$lib/settings';
import { getDefaultSettings } from '$lib/settings';
import { settings } from '$lib/stores/settings.svelte';
import {
	syncGlobalShortcutsWithSettings,
	syncLocalShortcutsWithSettings,
} from '../../../+layout/register-commands';

export function resetShortcutsToDefaults(type: 'local' | 'global') {
	const defaultSettings = getDefaultSettings();
	const updates = commands.reduce<Partial<Settings>>((acc, command) => {
		const shortcutKey = `shortcuts.${type}.${command.id}` as const;
		acc[shortcutKey] = defaultSettings[shortcutKey];
		return acc;
	}, {});

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
