import * as services from '$lib/services';
import { defineQuery } from '../_utils';

const deviceKeys = {
	mediaDevices: ['device', 'mediaDevices'] as const,
} as const;

export const device = {
	getMediaDevices: defineQuery({
		queryKey: deviceKeys.mediaDevices,
		resultQueryFn: () => services.manualRecorder.enumerateRecordingDevices(),
	}),
};
