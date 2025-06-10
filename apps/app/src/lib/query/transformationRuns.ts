import { DbTransformationsService } from '$lib/services/index.js';
import type { Accessor } from '@tanstack/svelte-query';
import { defineQuery } from '.';

// Define the query key as a constant array
export const transformationRunKeys = {
	all: ['transformationRuns'] as const,
	runsByTransformationId: (id: string) =>
		['transformationRuns', 'transformationId', id] as const,
	runsByRecordingId: (recordingId: string) =>
		['transformationRuns', 'recordingId', recordingId] as const,
};

export const transformations = {
	getTransformationRunsByTransformationId: (id: Accessor<string>) =>
		defineQuery({
			queryKey: transformationRunKeys.runsByTransformationId(id()),
			queryFn: () =>
				DbTransformationsService.getTransformationRunsByTransformationId(id()),
		}),
	getTransformationRunsByRecordingId: (recordingId: Accessor<string>) =>
		defineQuery({
			queryKey: transformationRunKeys.runsByRecordingId(recordingId()),
			queryFn: () =>
				DbTransformationsService.getTransformationRunsByRecordingId(
					recordingId(),
				),
		}),
	getLatestTransformationRunByRecordingId: (recordingId: Accessor<string>) =>
		defineQuery({
			queryKey: transformationRunKeys.runsByRecordingId(recordingId()),
			queryFn: () =>
				DbTransformationsService.getTransformationRunsByRecordingId(
					recordingId(),
				),
			select: (data) => data.at(0),
		}),
};
