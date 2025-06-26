import {
	type SettingsV8,
	getDefaultSettingsV1,
	migrateV1ToV2,
	migrateV2ToV3,
	migrateV3ToV4,
	migrateV4ToV5,
	migrateV5ToV6,
	migrateV6ToV7,
	migrateV7ToV8,
	settingsV1Schema,
	settingsV2Schema,
	settingsV3Schema,
	settingsV4Schema,
	settingsV5Schema,
	settingsV6Schema,
	settingsV7Schema,
	settingsV8Schema,
} from '$lib/settings';
import { toast } from '$lib/toast';
import { createPersistedState } from '$lib/utils/createPersistedState.svelte';

export const settings = createPersistedState({
	key: 'whispering-settings',
	schema: settingsV8Schema,
	onParseError: (error) => {
		const defaultSettings = migrateV7ToV8(
			migrateV6ToV7(
				migrateV5ToV6(
					migrateV4ToV5(
						migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(getDefaultSettingsV1()))),
					),
				),
			),
		);
		// For empty storage, return fully migrated defaults
		if (error.type === 'storage_empty') {
			return defaultSettings;
		}

		// For JSON parse errors, also return fully migrated defaults
		if (error.type === 'json_parse_error') {
			console.error('Failed to parse settings JSON:', error.error);
			return defaultSettings;
		}

		// For schema validation failures, attempt to migrate the value
		if (error.type === 'schema_validation_failed') {
			return migrateSettings(error.value);
		}

		// For async validation (shouldn't happen with our schemas)
		if (error.type === 'schema_validation_async_during_sync') {
			console.warn('Unexpected async validation for settings');
			return migrateSettings(error.value);
		}

		// Fallback - should never reach here
		return defaultSettings;
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

/**
 * Detects the version of stored settings and migrates to the latest version.
 * Attempts to preserve existing values by spreading them onto defaults when
 * schema validation fails.
 */
function migrateSettings(value: unknown): SettingsV8 {
	// Try parsing from newest to oldest version
	const v8Result = settingsV8Schema.safeParse(value);
	if (v8Result.success) {
		return v8Result.data;
	}

	const v7Result = settingsV7Schema.safeParse(value);
	if (v7Result.success) {
		return migrateV7ToV8(v7Result.data);
	}

	const v6Result = settingsV6Schema.safeParse(value);
	if (v6Result.success) {
		return migrateV7ToV8(migrateV6ToV7(v6Result.data));
	}

	const v5Result = settingsV5Schema.safeParse(value);
	if (v5Result.success) {
		return migrateV7ToV8(migrateV6ToV7(migrateV5ToV6(v5Result.data)));
	}

	const v4Result = settingsV4Schema.safeParse(value);
	if (v4Result.success) {
		return migrateV7ToV8(
			migrateV6ToV7(migrateV5ToV6(migrateV4ToV5(v4Result.data))),
		);
	}

	const v3Result = settingsV3Schema.safeParse(value);
	if (v3Result.success) {
		return migrateV7ToV8(
			migrateV6ToV7(migrateV5ToV6(migrateV4ToV5(migrateV3ToV4(v3Result.data)))),
		);
	}

	const v2Result = settingsV2Schema.safeParse(value);
	if (v2Result.success) {
		return migrateV7ToV8(
			migrateV6ToV7(
				migrateV5ToV6(
					migrateV4ToV5(migrateV3ToV4(migrateV2ToV3(v2Result.data))),
				),
			),
		);
	}

	const v1Result = settingsV1Schema.safeParse(value);
	if (v1Result.success) {
		return migrateV7ToV8(
			migrateV6ToV7(
				migrateV5ToV6(
					migrateV4ToV5(
						migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(v1Result.data))),
					),
				),
			),
		);
	}

	// If no schema matches, try to merge whatever we have onto defaults
	// This handles corrupted or partial data
	const defaultSettings = migrateV7ToV8(
		migrateV6ToV7(
			migrateV5ToV6(
				migrateV4ToV5(
					migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(getDefaultSettingsV1()))),
				),
			),
		),
	);

	const mergedSettings = {
		...defaultSettings,
		...(typeof value === 'object' && value !== null ? value : {}),
	};

	const mergedSettingsV8Result = settingsV8Schema.safeParse(mergedSettings);
	if (mergedSettingsV8Result.success) {
		return mergedSettingsV8Result.data;
	}
	return defaultSettings;
}
