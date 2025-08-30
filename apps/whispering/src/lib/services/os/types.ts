import type { OsType } from '@tauri-apps/plugin-os';

import { createTaggedError } from 'wellcrafted/error';

export const { OsServiceErr, OsServiceError } =
	createTaggedError('OsServiceError');

export type OsService = {
	type: () => OsType;
};
