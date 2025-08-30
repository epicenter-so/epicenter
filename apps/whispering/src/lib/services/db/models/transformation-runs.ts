/**
 * Represents an execution of a transformation, which can be run on either
 * a recording's transcribed text or arbitrary input text.
 */
export type TransformationRun =
	| TransformationRunCompleted
	| TransformationRunFailed
	| TransformationRunRunning;

export type TransformationRunCompleted = BaseTransformationRun & {
	output: string;
	status: 'completed';
};

export type TransformationRunFailed = BaseTransformationRun & {
	error: string;
	status: 'failed';
};

export type TransformationRunRunning = BaseTransformationRun & {
	status: 'running';
};

export type TransformationStepRun =
	| TransformationStepRunCompleted
	| TransformationStepRunFailed
	| TransformationStepRunRunning;

export type TransformationStepRunCompleted = BaseTransformationStepRun & {
	output: string;
	status: 'completed';
};

export type TransformationStepRunFailed = BaseTransformationStepRun & {
	error: string;
	status: 'failed';
};

export type TransformationStepRunRunning = BaseTransformationStepRun & {
	status: 'running';
};

/**
 * Base properties shared by all transformation run variants.
 *
 * Status transitions:
 * 1. 'running' - Initial state when created and transformation is immediately invoked
 * 2. 'completed' - When all steps have completed successfully
 * 3. 'failed' - If any step fails or an error occurs
 */
type BaseTransformationRun = {
	completedAt: null | string;
	id: string;
	/**
	 * Because the recording's transcribedText can change after invoking,
	 * we store a snapshot of the transcribedText at the time of invoking.
	 */
	input: string;
	/**
	 * Recording id if the transformation is invoked on a recording.
	 * Null if the transformation is invoked on arbitrary text input.
	 */
	recordingId: null | string;
	startedAt: string;
	stepRuns: TransformationStepRun[];
	transformationId: string;
};

/**
 * Base properties shared by all transformation step run variants.
 */
type BaseTransformationStepRun = {
	completedAt: null | string;
	id: string;
	input: string;
	startedAt: string;
	stepId: string;
};

// Type guards for TransformationRun
export function isTransformationRunCompleted(
	run: TransformationRun,
): run is TransformationRunCompleted {
	return run.status === 'completed';
}

export function isTransformationRunFailed(
	run: TransformationRun,
): run is TransformationRunFailed {
	return run.status === 'failed';
}

export function isTransformationRunRunning(
	run: TransformationRun,
): run is TransformationRunRunning {
	return run.status === 'running';
}

// Type guards for TransformationStepRun
export function isTransformationStepRunCompleted(
	stepRun: TransformationStepRun,
): stepRun is TransformationStepRunCompleted {
	return stepRun.status === 'completed';
}

export function isTransformationStepRunFailed(
	stepRun: TransformationStepRun,
): stepRun is TransformationStepRunFailed {
	return stepRun.status === 'failed';
}

export function isTransformationStepRunRunning(
	stepRun: TransformationStepRun,
): stepRun is TransformationStepRunRunning {
	return stepRun.status === 'running';
}
