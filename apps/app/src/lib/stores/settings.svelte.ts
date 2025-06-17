import { toast } from '$lib/toast';
import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
import {
	getDefaultSettingsV1,
	migrateV1ToV2,
	migrateV2ToV3,
	migrateV3ToV4,
	migrateV4ToV5,
	migrateV5ToV6,
	settingsV1Schema,
	settingsV2Schema,
	settingsV3Schema,
	settingsV4Schema,
	settingsV5Schema,
	settingsV6Schema,
} from '@repo/shared/settings';

const settingsV1 = createPersistedState({
	key: 'whispering-settings',
	schema: settingsV1Schema,
	defaultValue: getDefaultSettingsV1(),
});

export const settingsV2 = createPersistedState({
	key: 'whispering-settings',
	schema: settingsV2Schema,
	defaultValue: migrateV1ToV2(settingsV1.value),
});

export const settingsV3 = createPersistedState({
	key: 'whispering-settings',
	schema: settingsV3Schema,
	defaultValue: migrateV2ToV3(settingsV2.value),
});

export const settingsV4 = createPersistedState({
	key: 'whispering-settings',
	schema: settingsV4Schema,
	defaultValue: migrateV3ToV4(settingsV3.value),
});

export const settingsV5 = createPersistedState({
	key: 'whispering-settings',
	schema: settingsV5Schema,
	defaultValue: migrateV4ToV5(settingsV4.value),
});

export const settings = createPersistedState({
	key: 'whispering-settings',
	schema: settingsV6Schema,
	defaultValue: migrateV5ToV6(settingsV5.value),
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
