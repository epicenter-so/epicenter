import type { Result, TaggedError } from '@epicenterhq/result';
import type {
	ANTHROPIC_INFERENCE_MODELS,
	GOOGLE_INFERENCE_MODELS,
	GROQ_INFERENCE_MODELS,
	INFERENCE_PROVIDERS,
	OPENAI_INFERENCE_MODELS,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';

export type DbServiceErrorProperties = TaggedError<'DbServiceError'>;

export function generateDefaultTransformation(): Transformation {
	const now = new Date().toISOString();
	return {
		id: nanoid(),
		title: '',
		description: '',
		steps: [],
		createdAt: now,
		updatedAt: now,
	};
}

export function generateDefaultTransformationStep(): TransformationStep {
	return {
		id: nanoid(),
		type: 'prompt_transform',
		'prompt_transform.inference.provider': 'Groq',
		'prompt_transform.inference.provider.OpenAI.model': 'gpt-4o',
		'prompt_transform.inference.provider.Groq.model': 'llama-3.3-70b-versatile',
		'prompt_transform.inference.provider.Anthropic.model':
			'claude-3-5-sonnet-latest',
		'prompt_transform.inference.provider.Google.model': 'gemini-2.0-flash',

		'prompt_transform.systemPromptTemplate': '',
		'prompt_transform.userPromptTemplate': '',

		'find_replace.findText': '',
		'find_replace.replaceText': '',
		'find_replace.useRegex': false,
	};
}

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
	}) => Promise<Result<TransformationRun, DbServiceErrorProperties>>;
	markTransformationRunStepAsCompleted: (opts: {
		transformationRun: TransformationRun;
		stepRunId: string;
		output: string;
	}) => Promise<Result<TransformationRun, DbServiceErrorProperties>>;
	markTransformationRunAsCompleted: (opts: {
		transformationRun: TransformationRun;
		output: string;
	}) => Promise<Result<TransformationRun, DbServiceErrorProperties>>;
};

export const TRANSFORMATION_STEP_TYPES = [
	'prompt_transform',
	'find_replace',
] as const;

export const TRANSFORMATION_STEP_TYPES_TO_LABELS = {
	prompt_transform: 'Prompt Transform',
	find_replace: 'Find Replace',
} as const satisfies Record<(typeof TRANSFORMATION_STEP_TYPES)[number], string>;

export type Recording = {
	id: string;
	title: string;
	subtitle: string;
	timestamp: string;
	createdAt: string;
	updatedAt: string;
	transcribedText: string;
	blob: Blob | undefined;
	/**
	 * A recording
	 * 1. Begins in an 'UNPROCESSED' state
	 * 2. Moves to 'TRANSCRIBING' while the audio is being transcribed
	 * 3. Finally is marked as 'DONE' when the transcription is complete.
	 * 4. If the transcription fails, it is marked as 'FAILED'
	 */
	transcriptionStatus: 'UNPROCESSED' | 'TRANSCRIBING' | 'DONE' | 'FAILED';
};

export type Transformation = {
	id: string;
	title: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	/**
	 * It can be one of several types of text transformations:
	 * - find_replace: Replace text patterns with new text
	 * - prompt_transform: Use AI to transform text based on prompts
	 */
	steps: {
		id: string;
		// For now, steps don't need titles or descriptions. They can be computed from the type as "Find and Replace" or "Prompt Transform"
		type: (typeof TRANSFORMATION_STEP_TYPES)[number];

		'prompt_transform.inference.provider': (typeof INFERENCE_PROVIDERS)[number];
		'prompt_transform.inference.provider.OpenAI.model': (typeof OPENAI_INFERENCE_MODELS)[number];
		'prompt_transform.inference.provider.Groq.model': (typeof GROQ_INFERENCE_MODELS)[number];
		'prompt_transform.inference.provider.Anthropic.model': (typeof ANTHROPIC_INFERENCE_MODELS)[number];
		'prompt_transform.inference.provider.Google.model': (typeof GOOGLE_INFERENCE_MODELS)[number];

		'prompt_transform.systemPromptTemplate': string;
		'prompt_transform.userPromptTemplate': string;

		'find_replace.findText': string;
		'find_replace.replaceText': string;
		'find_replace.useRegex': boolean;
	}[];
};

export type TransformationStep = Transformation['steps'][number];
export type InsertTransformationStep = Omit<
	TransformationStep,
	'createdAt' | 'updatedAt'
>;

/**
 * Represents an execution of a transformation, which can be run on either
 * a recording's transcribed text or arbitrary input text.
 *
 * Status transitions:
 * 1. 'running' - Initial state when created and transformation is immediately invoked
 * 2. 'completed' - When all steps have completed successfully
 * 3. 'failed' - If any step fails or an error occurs
 */
export type TransformationRun = {
	id: string;
	transformationId: string;
	/**
	 * Recording id if the transformation is invoked on a recording.
	 * Null if the transformation is invoked on arbitrary text input.
	 */
	recordingId: string | null;
	status: 'running' | 'completed' | 'failed';
	startedAt: string;
	completedAt: string | null;
	/**
	 * Because the recording's transcribedText can change after invoking,
	 * we store a snapshot of the transcribedText at the time of invoking.
	 */
	input: string;
	output: string | null;
	error: string | null;

	stepRuns: {
		id: string;
		stepId: string;
		/**
		 * Status transitions:
		 * 1. 'running' - Initial state when created and step is immediately invoked
		 * 2. 'completed' - When step completes successfully
		 * 3. 'failed' - If step execution fails
		 */
		status: 'running' | 'completed' | 'failed';
		startedAt: string;
		completedAt: string | null;
		input: string;
		output: string | null;
		error: string | null;
	}[];
};

export type TransformationStepRun = TransformationRun['stepRuns'][number];
