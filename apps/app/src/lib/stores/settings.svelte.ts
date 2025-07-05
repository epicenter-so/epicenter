import {
	type Settings,
	settingsSchema,
	getDefaultSettings,
	parseStoredSettings,
} from '$lib/settings/settings';
import { toast } from '$lib/toast';
import { createPersistedState } from '$lib/utils/createPersistedState.svelte';

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

		// For schema validation failures, use our progressive validation
		if (error.type === 'schema_validation_failed') {
			return parseStoredSettings(error.value);
		}

		// For async validation (shouldn't happen with our schemas)
		if (error.type === 'schema_validation_async_during_sync') {
			console.warn('Unexpected async validation for settings');
			return parseStoredSettings(error.value);
		}

		// Fallback - should never reach here
		return getDefaultSettings();
	},
	onUpdateSuccess: () => {
		toast.success({ title: 'Settings updated!', description: '' });
	},
	onUpdateError: (err) => {
		toast.error({
			title: 'Error updating settings',
			description: err instanceof Error ? err.message : 'Unknown error',
		});
	},
});
