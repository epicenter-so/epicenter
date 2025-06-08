import { services } from '$lib/services';
import type { createResultQuery } from '@tanstack/svelte-query';

const recorderKeys = {
	mediaDevices: ['mediaDevices'] as const,
} as const;

export const recorder = {
	getMediaDevices: () => ({
		queryKey: recorderKeys.mediaDevices,
		queryFn: () => services.recorder.enumerateRecordingDevices(),
	}),
} satisfies Record<string, Parameters<typeof createResultQuery>[0]>;
