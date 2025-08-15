import { rpc } from '$lib/query';
import {
	type Settings,
	getDefaultSettings,
	settingsSchema,
} from '$lib/settings/settings';
import { createPersistedState } from '@repo/svelte-utils';

export const settings = createPersistedState({
	key: 'whispering-settings',
	schema: settingsSchema,
	onParseError: (error) => {
		// For empty storage, return defaults
		if (error.type === 'storage_empty') {
			return getDefaultSettings();
		}

		// For JSON parse errors, return defaults
		if (error.type === 'json_parse_error') {
			console.error('Failed to parse settings JSON:', error.error);
			return getDefaultSettings();
		}

		// For schema validation failures, return defaults
		if (error.type === 'schema_validation_failed') {
			return getDefaultSettings();
		}

		// For async validation (shouldn't happen with our schemas)
		if (error.type === 'schema_validation_async_during_sync') {
			console.warn('Unexpected async validation for settings');
			return getDefaultSettings();
		}

		// Fallback - should never reach here
		return getDefaultSettings();
	},
	onUpdateSuccess: () => {
		rpc.notify.success.execute({ title: 'Settings updated!', description: '' });
	},
	onUpdateError: (err) => {
		rpc.notify.error.execute({
			title: 'Error updating settings',
			description: err instanceof Error ? err.message : 'Unknown error',
		});
	},
});
