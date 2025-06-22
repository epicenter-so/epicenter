import type { Result } from '@epicenterhq/result';
import type {
	DbServiceError,
	Recording,
	TransformationStepRun,
	TransformationRun,
	Transformation,
	TransformationRunCompleted,
	TransformationRunFailed,
} from './models';

export type DbService = {
	// Recording methods
	getAllRecordings: () => Promise<Result<Recording[], DbServiceError>>;
	getLatestRecording: () => Promise<Result<Recording | null, DbServiceError>>;
	getTranscribingRecordingIds: () => Promise<Result<string[], DbServiceError>>;
	getRecordingById: (
		id: string,
	) => Promise<Result<Recording | null, DbServiceError>>;
	createRecording: (
		recording: Recording,
	) => Promise<Result<Recording, DbServiceError>>;
	updateRecording: (
		recording: Recording,
	) => Promise<Result<Recording, DbServiceError>>;
	deleteRecording: (
		recording: Recording,
	) => Promise<Result<void, DbServiceError>>;
	deleteRecordings: (
		recordings: Recording[],
	) => Promise<Result<void, DbServiceError>>;
	/**
	 * Checks and deletes expired recordings based on current settings.
	 * This should be called:
	 * 1. On initial load
	 * 2. Before adding new recordings
	 * 3. When retention settings change
	 */
	cleanupExpiredRecordings: () => Promise<Result<void, DbServiceError>>;

	// Transformation methods
	getAllTransformations: () => Promise<
		Result<Transformation[], DbServiceError>
	>;
	getTransformationById: (
		id: string,
	) => Promise<Result<Transformation | null, DbServiceError>>;
	createTransformation: (
		transformation: Transformation,
	) => Promise<Result<Transformation, DbServiceError>>;
	updateTransformation: (
		transformation: Transformation,
	) => Promise<Result<Transformation, DbServiceError>>;
	deleteTransformation: (
		transformation: Transformation,
	) => Promise<Result<void, DbServiceError>>;
	deleteTransformations: (
		transformations: Transformation[],
	) => Promise<Result<void, DbServiceError>>;

	// Transformation run methods
	getTransformationRunById: (
		id: string,
	) => Promise<Result<TransformationRun | null, DbServiceError>>;
	getTransformationRunsByTransformationId: (
		transformationId: string,
	) => Promise<Result<TransformationRun[], DbServiceError>>;
	getTransformationRunsByRecordingId: (
		recordingId: string,
	) => Promise<Result<TransformationRun[], DbServiceError>>;
	createTransformationRun: (
		transformationRun: Pick<
			TransformationRun,
			'input' | 'transformationId' | 'recordingId'
		>,
	) => Promise<Result<TransformationRun, DbServiceError>>;
	addTransformationStepRunToTransformationRun: (opts: {
		transformationRun: TransformationRun;
		stepId: string;
		input: string;
	}) => Promise<Result<TransformationStepRun, DbServiceError>>;
	markTransformationRunAndRunStepAsFailed: (opts: {
		transformationRun: TransformationRun;
		stepRunId: string;
		error: string;
	}) => Promise<Result<TransformationRunFailed, DbServiceError>>;
	markTransformationRunStepAsCompleted: (opts: {
		transformationRun: TransformationRun;
		stepRunId: string;
		output: string;
	}) => Promise<Result<TransformationRun, DbServiceError>>;
	markTransformationRunAsCompleted: (opts: {
		transformationRun: TransformationRun;
		output: string;
	}) => Promise<Result<TransformationRunCompleted, DbServiceError>>;
};
