import * as services from '$lib/services';
import { defineQuery } from '../_utils';

const deviceKeys = {
	mediaDevices: ['device', 'mediaDevices'] as const,
	cpalDevices: ['device', 'cpalDevices'] as const,
} as const;

export type DeviceEnumerationStrategy = 'navigator' | 'cpal';

export const device = {
	getDevices: (deviceEnumerationStrategy: DeviceEnumerationStrategy) =>
		defineQuery({
			queryKey: deviceKeys.mediaDevices,
			resultQueryFn: () =>
				deviceEnumerationStrategy === 'navigator'
					? services.manualRecorder.enumerateRecordingDevices()
					: services.cpalRecorder.enumerateRecordingDevices(),
		}),
};
