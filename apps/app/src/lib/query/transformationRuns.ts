import type {
	DbServiceErrorProperties,
	TransformationRun,
} from '$lib/services/db/DbService';
import { DbTransformationsService } from '$lib/services/index.js';
import type { Accessor, CreateResultQueryOptions } from '@tanstack/svelte-query';

// Define the query key as a constant array
export const transformationRunKeys = {
	all: ['transformationRuns'] as const,
	runsByTransformationId: (id: string) =>
		['transformationRuns', 'transformationId', id] as const,
	runsByRecordingId: (recordingId: string) =>
		['transformationRuns', 'recordingId', recordingId] as const,
};

export const transformations = {
	getTransformationRunsByTransformationId: (id: Accessor<string>) => () =>
		({
			queryKey: transformationRunKeys.runsByTransformationId(id()),
			queryFn: () =>
				DbTransformationsService.getTransformationRunsByTransformationId(id()),
		}) satisfies CreateResultQueryOptions<
			TransformationRun[],
			DbServiceErrorProperties
		>,
	getTransformationRunsByRecordingId: (recordingId: Accessor<string>) => () =>
		({
			queryKey: transformationRunKeys.runsByRecordingId(recordingId()),
			queryFn: () =>
				DbTransformationsService.getTransformationRunsByRecordingId(
					recordingId(),
				),
		}) satisfies CreateResultQueryOptions<
			TransformationRun[],
			DbServiceErrorProperties
		>,
	getLatestTransformationRunByRecordingId:
		(recordingId: Accessor<string>) => () =>
			({
				queryKey: transformationRunKeys.runsByRecordingId(recordingId()),
				queryFn: () =>
					DbTransformationsService.getTransformationRunsByRecordingId(
						recordingId(),
					),
				select: (data) => data.at(0),
			}) satisfies CreateResultQueryOptions<
				TransformationRun[],
				DbServiceErrorProperties,
				TransformationRun | undefined
			>,
};
