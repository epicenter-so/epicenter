import { services } from '$lib/services';
import type { createResultQuery } from '@tanstack/svelte-query';

export const queries = {
	getMediaDevices: () => ({
		queryKey: ['mediaDevices'],
		queryFn: async () => {
			return await services.recorder.enumerateRecordingDevices();
		},
	}),
} satisfies Record<string, Parameters<typeof createResultQuery>[0]>;
