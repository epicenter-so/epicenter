import { createTaggedError } from 'wellcrafted/error';
import type { OsType } from '@tauri-apps/plugin-os';

const { OsServiceError, OsServiceErr } = createTaggedError('OsServiceError');
export type OsServiceError = ReturnType<typeof OsServiceError>;
export { OsServiceError, OsServiceErr };

export type OsService = {
	type: () => OsType;
};
