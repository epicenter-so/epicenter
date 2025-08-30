import { invoke } from '@tauri-apps/api/core';
import { tryAsync } from 'wellcrafted/result';

import type { AnalyticsService } from './types';

import { AnalyticsServiceErr } from './types';

export function createAnalyticsServiceDesktop(): AnalyticsService {
	return {
		logEvent: async (event) =>
			tryAsync({
				mapErr: (error) =>
					AnalyticsServiceErr({
						cause: error,
						context: { event },
						message: 'Failed to log analytics event via Tauri',
					}),
				try: async () => {
					const { type, ...properties } = event;
					await invoke<void>('plugin:aptabase|track_event', {
						name: type,
						props: properties,
					});
				},
			}),
	};
}
