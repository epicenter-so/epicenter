import { settings } from '$lib/stores/settings.svelte';
import {
	Err,
	Ok,
	type Result,
	type TaggedError,
	extractErrorMessage,
	isErr,
} from '@epicenterhq/result';
import { createAnthropicCompletionService } from './completion/anthropic';
import { createGoogleCompletionService } from './completion/google';
import { createGroqCompletionService } from './completion/groq';
import { createOpenAiCompletionService } from './completion/openai';
import type {
	TransformationRunCompleted,
	TransformationRunFailed,
	TransformationStep,
} from './db/models';
import type { DbService } from './db/types';
import type { HttpService } from './http/_types';

type TransformServiceError = TaggedError<'TransformServiceError'>;

export function createTransformerService({
	DbService,
	HttpService,
}: {
	DbService: DbService;
	HttpService: HttpService;
}) {
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

	return {
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
		runTransformation: async ({
			input,
			transformationId,
			recordingId,
		}: {
			input: string;
			transformationId: string;
			recordingId: string | null;
		}): Promise<
			Result<
				TransformationRunCompleted | TransformationRunFailed,
				TransformServiceError
			>
		> => {
			if (!input.trim()) {
				return Err({
					name: 'TransformServiceError',
					message: 'Empty input. Please enter some text to transform',
					cause: undefined,
					context: { input, transformationId },
				});
			}
			const { data: transformation, error: getTransformationError } =
				await DbService.getTransformationById(transformationId);
			if (getTransformationError || !transformation) {
				return Err({
					name: 'TransformServiceError',
					message: 'Could not find the selected transformation.',
					cause: getTransformationError ?? undefined,
					context: { transformationId, getTransformationError },
				});
			}

			if (transformation.steps.length === 0) {
				return Err({
					name: 'TransformServiceError',
					message:
						'No steps configured. Please add at least one transformation step',
					cause: undefined,
					context: { transformationId, transformation },
				});
			}

			const { data: transformationRun, error: createTransformationRunError } =
				await DbService.createTransformationRun({
					transformationId: transformation.id,
					recordingId,
					input,
				});

			if (createTransformationRunError)
				return Err({
					name: 'TransformServiceError',
					message: 'Unable to start transformation run',
					cause: createTransformationRunError,
					context: {
						transformationId,
						recordingId,
						input,
						createTransformationRunError,
					},
				});

			let currentInput = input;

			for (const step of transformation.steps) {
				const {
					data: newTransformationStepRun,
					error: addTransformationStepRunError,
				} = await DbService.addTransformationStepRunToTransformationRun({
					transformationRun,
					stepId: step.id,
					input: currentInput,
				});

				if (addTransformationStepRunError)
					return Err({
						name: 'TransformServiceError',
						message: 'Unable to initialize transformation step',
						cause: addTransformationStepRunError,
						context: {
							transformationRun,
							stepId: step.id,
							input: currentInput,
							addTransformationStepRunError,
						},
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
					} = await DbService.markTransformationRunAndRunStepAsFailed({
						transformationRun,
						stepRunId: newTransformationStepRun.id,
						error: handleStepResult.error,
					});
					if (markTransformationRunAndRunStepAsFailedError)
						return Err({
							name: 'TransformServiceError',
							message: 'Unable to save failed transformation step result',
							cause: markTransformationRunAndRunStepAsFailedError,
							context: {
								transformationRun,
								stepRunId: newTransformationStepRun.id,
								error: handleStepResult.error,
								markTransformationRunAndRunStepAsFailedError,
							},
						});
					return Ok(markedFailedTransformationRun);
				}

				const handleStepOutput = handleStepResult.data;

				const { error: markTransformationRunStepAsCompletedError } =
					await DbService.markTransformationRunStepAsCompleted({
						transformationRun,
						stepRunId: newTransformationStepRun.id,
						output: handleStepOutput,
					});

				if (markTransformationRunStepAsCompletedError)
					return Err({
						name: 'TransformServiceError',
						message: 'Unable to save completed transformation step result',
						cause: markTransformationRunStepAsCompletedError,
						context: {
							transformationRun,
							stepRunId: newTransformationStepRun.id,
							output: handleStepOutput,
							markTransformationRunStepAsCompletedError,
						},
					});

				currentInput = handleStepOutput;
			}

			const {
				data: markedCompletedTransformationRun,
				error: markTransformationRunAsCompletedError,
			} = await DbService.markTransformationRunAsCompleted({
				transformationRun,
				output: currentInput,
			});

			if (markTransformationRunAsCompletedError)
				return Err({
					name: 'TransformServiceError',
					message: 'Unable to save completed transformation run',
					cause: markTransformationRunAsCompletedError,
					context: {
						transformationRun,
						output: currentInput,
						markTransformationRunAsCompletedError,
					},
				});
			return Ok(markedCompletedTransformationRun);
		},
	};
}
