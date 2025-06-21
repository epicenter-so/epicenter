import type { OsService } from './types';
import * as os from '@tauri-apps/plugin-os';

export function createOsServiceDesktop(): OsService {
	return {
		type: () => {
			return os.type();
		},
	};
}
