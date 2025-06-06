import { DbTransformationsService } from '$lib/services/index.js';
import { createResultQuery } from '@tanstack/svelte-query';
import type { Accessor } from '../types';

// Define the query key as a constant array
export const transformationRunKeys = {
	all: ['transformationRuns'] as const,
	runsByTransformationId: (id: string) =>
		['transformationRuns', 'transformationId', id] as const,
	runsByRecordingId: (recordingId: string) =>
		['transformationRuns', 'recordingId', recordingId] as const,
};

export function useTransformationRunsByTransformationIdQuery(
	id: Accessor<string>,
) {
	return {
		transformationRunsByTransformationIdQuery: createResultQuery(() => ({
			queryKey: transformationRunKeys.runsByTransformationId(id()),
			queryFn: () =>
				DbTransformationsService.getTransformationRunsByTransformationId(id()),
		})),
	};
}

export function useTransformationRunsByRecordingId(
	recordingId: Accessor<string>,
) {
	return {
		transformationRunsByRecordingIdQuery: createResultQuery(() => ({
			queryKey: transformationRunKeys.runsByRecordingId(recordingId()),
			queryFn: () =>
				DbTransformationsService.getTransformationRunsByRecordingId(
					recordingId(),
				),
		})),
	};
}

export function useLatestTransformationRunByRecordingIdQuery(
	recordingId: Accessor<string>,
) {
	return {
		latestTransformationRunByRecordingIdQuery: createResultQuery(() => ({
			queryKey: transformationRunKeys.runsByRecordingId(recordingId()),
			queryFn: () =>
				DbTransformationsService.getTransformationRunsByRecordingId(
					recordingId(),
				),
			select: (data) => data.at(0),
		})),
	};
}
