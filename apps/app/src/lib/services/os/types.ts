import type { TaggedError } from 'wellcrafted/error';
import type { OsType } from '@tauri-apps/plugin-os';

export type OsServiceError = TaggedError<'OsServiceError'>;

export type OsService = {
	type: () => OsType;
};
