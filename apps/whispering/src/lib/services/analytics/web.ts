import { init, trackEvent } from '@aptabase/web';
import { tryAsync } from 'wellcrafted/result';

import type { AnalyticsService } from './types';

import { AnalyticsServiceErr } from './types';

init('A-US-5744332458');

export function createAnalyticsServiceWeb(): AnalyticsService {
	return {
		logEvent: async (event) =>
			tryAsync({
				mapErr: (error) =>
					AnalyticsServiceErr({
						cause: error,
						context: { event },
						message: 'Failed to log analytics event',
					}),
				try: async () => {
					const { type, ...properties } = event;
					await trackEvent(type, properties);
				},
			}),
	};
}
