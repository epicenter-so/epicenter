import { getDefaultSettings } from '$lib/settings';
import { settings } from '$lib/stores/settings.svelte';

export function resetAllSettingsToDefaults() {
	settings.value = getDefaultSettings();
}