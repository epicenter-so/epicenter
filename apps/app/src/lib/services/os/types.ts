import type { OsType } from '@tauri-apps/plugin-os';
import { createTaggedError } from 'wellcrafted/error';

const { OsServiceError, OsServiceErr } = createTaggedError('OsServiceError');
export type OsServiceError = ReturnType<typeof OsServiceError>;
export { type OsServiceError, OsServiceErr };

export type OsService = {
	type: () => OsType;
};
