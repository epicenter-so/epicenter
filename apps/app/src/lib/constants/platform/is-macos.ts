import { OsServiceLive } from '$lib/services/os';

export const IS_MACOS = OsServiceLive.type() === 'macos';
