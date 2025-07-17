import type { OsType } from '@tauri-apps/plugin-os';
import { createTaggedError } from 'wellcrafted/error';

const { OsServiceError, OsServiceErr } = createTaggedError('OsServiceError');
export { OsServiceError, OsServiceErr };

export type OsService = {
	type: () => OsType;
};
