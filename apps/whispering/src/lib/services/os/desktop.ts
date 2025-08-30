import * as os from '@tauri-apps/plugin-os';

import type { OsService } from '.';

export function createOsServiceDesktop(): OsService {
	return {
		type: () => {
			return os.type();
		},
	};
}
