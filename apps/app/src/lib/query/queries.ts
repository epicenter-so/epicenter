import { services } from '$lib/services';
import { Err, Ok } from '@epicenterhq/result';
import { WhisperingError } from '@repo/shared';
import type { createResultQuery } from '@tanstack/svelte-query';

export const queries = {
	getMediaDevices: () => ({
		queryKey: ['mediaDevices'],
		queryFn: async () => {
			const { data: mediaDevices, error: enumerateRecordingDevicesError } =
				await services.recorder.enumerateRecordingDevices();
			if (enumerateRecordingDevicesError) {
				return Err(
					WhisperingError({
						title: 'Error loading devices',
						description: enumerateRecordingDevicesError.message,
						context: {},
						cause: enumerateRecordingDevicesError,
					}),
				);
			}
			return Ok(mediaDevices);
		},
	}),
} satisfies Record<string, Parameters<typeof createResultQuery>[0]>;
