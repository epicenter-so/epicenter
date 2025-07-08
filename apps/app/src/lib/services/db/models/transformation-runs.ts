/**
 * Base properties shared by all transformation step run variants.
 */
type BaseTransformationStepRun = {
	id: string;
	stepId: string;
	startedAt: string;
	completedAt: string | null;
	input: string;
};

export type TransformationStepRunRunning = BaseTransformationStepRun & {
	status: 'running';
};

export type TransformationStepRunCompleted = BaseTransformationStepRun & {
	status: 'completed';
	output: string;
};

export type TransformationStepRunFailed = BaseTransformationStepRun & {
	status: 'failed';
	error: string;
};

export type TransformationStepRun =
	| TransformationStepRunRunning
	| TransformationStepRunCompleted
	| TransformationStepRunFailed;

/**
 * Base properties shared by all transformation run variants.
 *
 * Status transitions:
 * 1. 'running' - Initial state when created and transformation is immediately invoked
 * 2. 'completed' - When all steps have completed successfully
 * 3. 'failed' - If any step fails or an error occurs
 */
type BaseTransformationRun = {
	id: string;
	transformationId: string;
	/**
	 * Recording id if the transformation is invoked on a recording.
	 * Null if the transformation is invoked on arbitrary text input.
	 */
	recordingId: string | null;
	startedAt: string;
	completedAt: string | null;
	/**
	 * Because the recording's transcribedText can change after invoking,
	 * we store a snapshot of the transcribedText at the time of invoking.
	 */
	input: string;
	stepRuns: TransformationStepRun[];
};

export type TransformationRunRunning = BaseTransformationRun & {
	status: 'running';
};

export type TransformationRunCompleted = BaseTransformationRun & {
	status: 'completed';
	output: string;
};

export type TransformationRunFailed = BaseTransformationRun & {
	status: 'failed';
	error: string;
};

/**
 * Represents an execution of a transformation, which can be run on either
 * a recording's transcribed text or arbitrary input text.
 */
export type TransformationRun =
	| TransformationRunRunning
	| TransformationRunCompleted
	| TransformationRunFailed;

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
