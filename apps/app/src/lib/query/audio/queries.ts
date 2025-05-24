import { userConfiguredServices } from '$lib/services';
import type { WhisperingError } from '@repo/shared';
import { createQuery } from '@tanstack/svelte-query';

export function useGetMediaDevices() {
	return {
		getMediaDevicesQuery: createQuery<
			Pick<MediaDeviceInfo, 'label' | 'deviceId'>[],
			WhisperingError
		>(() => ({
			queryKey: ['mediaDevices'],
			queryFn: async () => {
				const { data: mediaDevices, error: enumerateRecordingDevicesError } =
					await userConfiguredServices.recorder.enumerateRecordingDevices();
				if (enumerateRecordingDevicesError) {
					throw enumerateRecordingDevicesError;
				}
				return mediaDevices;
			},
		})),
	};
}
