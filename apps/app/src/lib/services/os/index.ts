import type { TaggedError } from '@epicenterhq/result';
import type { OsType } from '@tauri-apps/plugin-os';

export type OsServiceError = TaggedError<'OsServiceError'>;

export type OsService = {
	type: () => OsType;
};
