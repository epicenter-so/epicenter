import type { Recording, TransformationRun } from '$lib/services/db';

export function getRecordingTransitionId({
	propertyName,
	recordingId,
}: {
	propertyName: 'latestTransformationRunOutput' | keyof Recording;
	recordingId: string;
}): string {
	return `recording-${recordingId}-${propertyName}` as const;
}

export function getTransformationStepRunTransitionId({
	propertyName,
	stepRunId,
}: {
	propertyName: keyof TransformationRun;
	stepRunId: string;
}): string {
	return `transformation-run-${stepRunId}-${propertyName}` as const;
}
