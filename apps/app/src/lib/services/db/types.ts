import type { Result } from '@epicenterhq/result';
import type {
	DbServiceErrorProperties,
	Recording,
	TransformationStepRun,
	TransformationRun,
	Transformation,
	TransformationRunCompleted,
	TransformationRunFailed,
} from './models';

export type DbService = {
	// Recording methods
	getAllRecordings: () => Promise<
		Result<Recording[], DbServiceErrorProperties>
	>;
	getLatestRecording: () => Promise<
		Result<Recording | null, DbServiceErrorProperties>
	>;
	getTranscribingRecordingIds: () => Promise<
		Result<string[], DbServiceErrorProperties>
	>;
	getRecordingById: (
		id: string,
	) => Promise<Result<Recording | null, DbServiceErrorProperties>>;
	createRecording: (
		recording: Recording,
	) => Promise<Result<Recording, DbServiceErrorProperties>>;
	updateRecording: (
		recording: Recording,
	) => Promise<Result<Recording, DbServiceErrorProperties>>;
	deleteRecording: (
		recording: Recording,
	) => Promise<Result<void, DbServiceErrorProperties>>;
	deleteRecordings: (
		recordings: Recording[],
	) => Promise<Result<void, DbServiceErrorProperties>>;
	/**
	 * Checks and deletes expired recordings based on current settings.
	 * This should be called:
	 * 1. On initial load
	 * 2. Before adding new recordings
	 * 3. When retention settings change
	 */
	cleanupExpiredRecordings: () => Promise<
		Result<void, DbServiceErrorProperties>
	>;

	// Transformation methods
	getAllTransformations: () => Promise<
		Result<Transformation[], DbServiceErrorProperties>
	>;
	getTransformationById: (
		id: string,
	) => Promise<Result<Transformation | null, DbServiceErrorProperties>>;
	createTransformation: (
		transformation: Transformation,
	) => Promise<Result<Transformation, DbServiceErrorProperties>>;
	updateTransformation: (
		transformation: Transformation,
	) => Promise<Result<Transformation, DbServiceErrorProperties>>;
	deleteTransformation: (
		transformation: Transformation,
	) => Promise<Result<void, DbServiceErrorProperties>>;
	deleteTransformations: (
		transformations: Transformation[],
	) => Promise<Result<void, DbServiceErrorProperties>>;

	// Transformation run methods
	getTransformationRunById: (
		id: string,
	) => Promise<Result<TransformationRun | null, DbServiceErrorProperties>>;
	getTransformationRunsByTransformationId: (
		transformationId: string,
	) => Promise<Result<TransformationRun[], DbServiceErrorProperties>>;
	getTransformationRunsByRecordingId: (
		recordingId: string,
	) => Promise<Result<TransformationRun[], DbServiceErrorProperties>>;
	createTransformationRun: (
		transformationRun: Pick<
			TransformationRun,
			'input' | 'transformationId' | 'recordingId'
		>,
	) => Promise<Result<TransformationRun, DbServiceErrorProperties>>;
	addTransformationStepRunToTransformationRun: (opts: {
		transformationRun: TransformationRun;
		stepId: string;
		input: string;
	}) => Promise<Result<TransformationStepRun, DbServiceErrorProperties>>;
	markTransformationRunAndRunStepAsFailed: (opts: {
		transformationRun: TransformationRun;
		stepRunId: string;
		error: string;
	}) => Promise<Result<TransformationRunFailed, DbServiceErrorProperties>>;
	markTransformationRunStepAsCompleted: (opts: {
		transformationRun: TransformationRun;
		stepRunId: string;
		output: string;
	}) => Promise<Result<TransformationRun, DbServiceErrorProperties>>;
	markTransformationRunAsCompleted: (opts: {
		transformationRun: TransformationRun;
		output: string;
	}) => Promise<Result<TransformationRunCompleted, DbServiceErrorProperties>>;
};
