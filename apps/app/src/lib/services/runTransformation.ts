import { settings } from '$lib/stores/settings.svelte';
import {
	Err,
	Ok,
	type Result,
	extractErrorMessage,
	isErr,
} from '@epicenterhq/result';
import { WhisperingError } from '@repo/shared';
import { DbRecordingsService } from '.';
import { createAnthropicCompletionService } from './completion/anthropic';
import { createGoogleCompletionService } from './completion/google';
import { createGroqCompletionService } from './completion/groq';
import { createOpenAiCompletionService } from './completion/openai';
import type {
	DbTransformationsService,
	TransformationRun,
	TransformationStep,
} from './db';
import type { HttpService } from './http/_types';

type TransformErrorProperties = {
	name: 'TransformError';
	code:
		| 'RECORDING_NOT_FOUND'
		| 'NO_INPUT'
		| 'TRANSFORMATION_NOT_FOUND'
		| 'NO_STEPS_CONFIGURED'
		| 'FAILED_TO_CREATE_TRANSFORMATION_RUN'
		| 'FAILED_TO_ADD_TRANSFORMATION_STEP_RUN'
		| 'FAILED_TO_MARK_TRANSFORMATION_RUN_AND_STEP_AS_FAILED'
		| 'FAILED_TO_MARK_TRANSFORMATION_RUN_STEP_AS_COMPLETED'
		| 'FAILED_TO_MARK_TRANSFORMATION_RUN_AS_COMPLETED';
};

export type TransformError = Err<TransformErrorProperties>;
export type TransformResult<T> = Ok<T> | TransformError;

export const TransformErrorToWhisperingErr = ({ error }: TransformError) => {
	switch (error.code) {
		case 'NO_INPUT':
			return Err(
				WhisperingError({
					title: '⚠️ Empty input',
					description: 'Please enter some text to transform',
					context: { error },
					cause: error,
				}),
			);
		case 'RECORDING_NOT_FOUND':
			return Err(
				WhisperingError({
					title: '⚠️ Recording not found',
					description: 'Could not find the selected recording.',
					context: { error },
					cause: error,
				}),
			);
		case 'TRANSFORMATION_NOT_FOUND':
			return Err(
				WhisperingError({
					title: '⚠️ Transformation not found',
					description: 'Could not find the selected transformation.',
					context: { error },
					cause: error,
				}),
			);
		case 'NO_STEPS_CONFIGURED':
			return Err(
				WhisperingError({
					title: 'No steps configured',
					description: 'Please add at least one transformation step',
					context: { error },
					cause: error,
				}),
			);
		case 'FAILED_TO_CREATE_TRANSFORMATION_RUN':
			return Err(
				WhisperingError({
					title: '⚠️ Failed to create transformation run',
					description: 'Could not create the transformation run.',
					context: { error },
					cause: error,
				}),
			);
		case 'FAILED_TO_ADD_TRANSFORMATION_STEP_RUN':
			return Err(
				WhisperingError({
					title: '⚠️ Failed to add transformation step run',
					description: 'Could not add the transformation step run.',
					context: { error },
					cause: error,
				}),
			);
		case 'FAILED_TO_MARK_TRANSFORMATION_RUN_AND_STEP_AS_FAILED':
			return Err(
				WhisperingError({
					title: '⚠️ Failed to mark transformation run and step as failed',
					description:
						'Could not mark the transformation run and step as failed.',
					context: { error },
					cause: error,
				}),
			);
		case 'FAILED_TO_MARK_TRANSFORMATION_RUN_STEP_AS_COMPLETED':
			return Err(
				WhisperingError({
					title: '⚠️ Failed to mark transformation run step as completed',
					description:
						'Could not mark the transformation run step as completed.',
					context: { error },
					cause: error,
				}),
			);
		case 'FAILED_TO_MARK_TRANSFORMATION_RUN_AS_COMPLETED':
			return Err(
				WhisperingError({
					title: '⚠️ Failed to mark transformation run as completed',
					description: 'Could not mark the transformation run as completed.',
					context: { error },
					cause: error,
				}),
			);
	}
};

export const TransformError = <
	T extends Omit<TransformErrorProperties, 'name'>,
>(
	properties: T,
) =>
	Err({
		name: 'TransformError',
		...properties,
	}) satisfies TransformError;

export function createRunTransformationService({
	DbTransformationsService,
	HttpService,
}: {
	DbTransformationsService: DbTransformationsService;
	HttpService: HttpService;
}) {
	/**
	 * Processes a single transformation step and returns the transformed output.
	 *
	 * This function handles different types of transformation steps:
	 * - **find_replace**: Performs text find/replace operations (with optional regex support)
	 * - **prompt_transform**: Uses AI providers (OpenAI, Groq, Anthropic, Google) to transform text
	 *
	 * **Error Handling Strategy:**
	 * When errors occur during step processing, they are collapsed into simple string error messages
	 * that can be stored in the database. This design choice ensures:
	 * 1. **Database Compatibility**: Complex error objects are flattened to strings for storage
	 * 2. **User-Friendly Messages**: Technical errors are converted to readable descriptions
	 * 3. **Consistent Interface**: All step types return the same Result<string, string> format
	 *
	 * The error strings are later saved to the database via `markTransformationRunAndRunStepAsFailed`
	 * which stores both the transformation run failure and the specific step failure with the error message.
	 *
	 * @param input - The text input to be transformed by this step
	 * @param step - The transformation step configuration containing type and parameters
	 * @param HttpService - Service for making HTTP requests to AI providers
	 * @returns Promise<Result<string, string>> - Success with transformed text or error with descriptive message
	 *
	 * @example
	 * ```typescript
	 * // Find/replace transformation
	 * const result = await handleStep({
	 *   input: "Hello world",
	 *   step: { type: 'find_replace', 'find_replace.findText': 'world', 'find_replace.replaceText': 'universe' },
	 *   HttpService
	 * });
	 * // Result: Ok("Hello universe")
	 *
	 * // AI prompt transformation with error
	 * const result = await handleStep({
	 *   input: "Summarize this text",
	 *   step: { type: 'prompt_transform', provider: 'OpenAI', ... },
	 *   HttpService
	 * });
	 * // On API error: Err("OpenAI API Error: Rate limit exceeded (429)")
	 * ```
	 */
	const handleStep = async ({
		input,
		step,
		HttpService,
	}: {
		input: string;
		step: TransformationStep;
		HttpService: HttpService;
	}): Promise<Result<string, string>> => {
		switch (step.type) {
			case 'find_replace': {
				const findText = step['find_replace.findText'];
				const replaceText = step['find_replace.replaceText'];
				const useRegex = step['find_replace.useRegex'];

				if (useRegex) {
					try {
						const regex = new RegExp(findText, 'g');
						return Ok(input.replace(regex, replaceText));
					} catch (error) {
						return Err(`Invalid regex pattern: ${extractErrorMessage(error)}`);
					}
				}

				return Ok(input.replaceAll(findText, replaceText));
			}

			case 'prompt_transform': {
				const provider = step['prompt_transform.inference.provider'];
				const systemPrompt = step[
					'prompt_transform.systemPromptTemplate'
				].replace('{{input}}', input);
				const userPrompt = step['prompt_transform.userPromptTemplate'].replace(
					'{{input}}',
					input,
				);

				switch (provider) {
					case 'OpenAI': {
						const { data: completionResponse, error: completionError } =
							await createOpenAiCompletionService({
								apiKey: settings.value['apiKeys.openai'],
								HttpService,
							}).complete({
								systemPrompt,
								userPrompt,
								model: step['prompt_transform.inference.provider.OpenAI.model'],
							});

						if (completionError) {
							return Err(completionError.message);
						}

						return Ok(completionResponse);
					}

					case 'Groq': {
						const model =
							step['prompt_transform.inference.provider.Groq.model'];
						const { data: completionResponse, error: completionError } =
							await createGroqCompletionService({
								apiKey: settings.value['apiKeys.groq'],
								HttpService,
							}).complete({
								model,
								systemPrompt,
								userPrompt,
							});

						if (completionError) {
							return Err(completionError.message);
						}

						return Ok(completionResponse);
					}

					case 'Anthropic': {
						const { data: completionResponse, error: completionError } =
							await createAnthropicCompletionService({
								apiKey: settings.value['apiKeys.anthropic'],
								HttpService,
							}).complete({
								model:
									step['prompt_transform.inference.provider.Anthropic.model'],
								systemPrompt,
								userPrompt,
							});

						if (completionError) {
							return Err(completionError.message);
						}

						return Ok(completionResponse);
					}

					case 'Google': {
						const { data: completion, error: completionError } =
							await createGoogleCompletionService({
								apiKey: settings.value['apiKeys.google'],
							}).complete({
								model: step['prompt_transform.inference.provider.Google.model'],
								systemPrompt,
								userPrompt,
								// TODO: Add temperature to step settings
								// temperature: 0,
							});

						if (completionError) {
							return Err(completionError.message);
						}

						return Ok(completion);
					}

					default:
						return Err(`Unsupported provider: ${provider}`);
				}
			}

			default:
				return Err(`Unsupported step type: ${step.type}`);
		}
	};

	/**
	 * Executes a complete transformation pipeline by running input through a series of transformation steps.
	 *
	 * **Error Persistence Strategy:**
	 * When any step fails during transformation, the error handling follows this pattern:
	 * 1. **Error Capture**: handleStep returns string error messages for failed operations
	 * 2. **Database Persistence**: Failed steps are marked in the database with the error message
	 * 3. **Early Termination**: Processing stops at the first failed step
	 * 4. **Audit Trail**: Both the transformation run and specific step failure are recorded
	 *
	 * This approach ensures complete traceability of what went wrong and where in the pipeline.
	 *
	 * @param input - The initial text input to transform
	 * @param transformationId - ID of the transformation configuration to execute
	 * @param recordingId - Optional ID of the source recording (null for direct input)
	 * @returns Promise<TransformResult<TransformationRun>> - Complete transformation run with results or error
	 */
	const runTransformation = async ({
		input,
		transformationId,
		recordingId,
	}: {
		input: string;
		transformationId: string;
		recordingId: string | null;
	}): Promise<TransformResult<TransformationRun>> => {
		const { data: transformation, error: getTransformationError } =
			await DbTransformationsService.getTransformationById(transformationId);
		if (getTransformationError || !transformation) {
			return TransformError({ code: 'TRANSFORMATION_NOT_FOUND' });
		}

		if (transformation.steps.length === 0) {
			return TransformError({ code: 'NO_STEPS_CONFIGURED' });
		}

		const { data: transformationRun, error: createTransformationRunError } =
			await DbTransformationsService.createTransformationRun({
				transformationId: transformation.id,
				recordingId,
				input,
			});

		if (createTransformationRunError)
			return TransformError({
				code: 'FAILED_TO_CREATE_TRANSFORMATION_RUN',
			});

		let currentInput = input;

		for (const step of transformation.steps) {
			const {
				data: newTransformationStepRun,
				error: addTransformationStepRunError,
			} =
				await DbTransformationsService.addTransformationStepRunToTransformationRun(
					{ transformationRun, stepId: step.id, input: currentInput },
				);

			if (addTransformationStepRunError)
				return TransformError({
					code: 'FAILED_TO_ADD_TRANSFORMATION_STEP_RUN',
				});

			const handleStepResult = await handleStep({
				input: currentInput,
				step,
				HttpService,
			});

			if (isErr(handleStepResult)) {
				const {
					data: markedFailedTransformationRun,
					error: markTransformationRunAndRunStepAsFailedError,
				} =
					await DbTransformationsService.markTransformationRunAndRunStepAsFailed(
						{
							transformationRun,
							stepRunId: newTransformationStepRun.id,
							error: handleStepResult.error,
						},
					);
				if (markTransformationRunAndRunStepAsFailedError)
					return TransformError({
						code: 'FAILED_TO_MARK_TRANSFORMATION_RUN_AND_STEP_AS_FAILED',
					});
				return Ok(markedFailedTransformationRun);
			}

			const handleStepOutput = handleStepResult.data;

			const { error: markTransformationRunStepAsCompletedError } =
				await DbTransformationsService.markTransformationRunStepAsCompleted({
					transformationRun,
					stepRunId: newTransformationStepRun.id,
					output: handleStepOutput,
				});

			if (markTransformationRunStepAsCompletedError)
				return TransformError({
					code: 'FAILED_TO_MARK_TRANSFORMATION_RUN_STEP_AS_COMPLETED',
				});

			currentInput = handleStepOutput;
		}

		const {
			data: markedCompletedTransformationRun,
			error: markTransformationRunAsCompletedError,
		} = await DbTransformationsService.markTransformationRunAsCompleted({
			transformationRun,
			output: currentInput,
		});

		if (markTransformationRunAsCompletedError)
			return TransformError({
				code: 'FAILED_TO_MARK_TRANSFORMATION_RUN_AS_COMPLETED',
			});
		return Ok(markedCompletedTransformationRun);
	};

	return {
		transformInput: async ({
			input,
			transformationId,
		}: {
			input: string;
			transformationId: string;
		}): Promise<TransformResult<TransformationRun>> => {
			if (!input.trim()) {
				return TransformError({ code: 'NO_INPUT' });
			}
			return runTransformation({
				input,
				transformationId,
				recordingId: null,
			});
		},
		transformRecording: async ({
			transformationId,
			recordingId,
		}: {
			transformationId: string;
			recordingId: string;
		}): Promise<TransformResult<TransformationRun>> => {
			const { data: recording, error: getRecordingError } =
				await DbRecordingsService.getRecordingById(recordingId);
			if (getRecordingError || !recording) {
				return TransformError({ code: 'RECORDING_NOT_FOUND' });
			}

			return runTransformation({
				input: recording.transcribedText,
				transformationId,
				recordingId,
			});
		},
	};
}
