import * as services from '$lib/services';
import type {
	TransformationRunCompleted,
	TransformationRunFailed,
	TransformationStep,
} from '$lib/services/db';
import { settings } from '$lib/stores/settings.svelte';
import {
	Err,
	extractErrorMessage,
	isErr,
	Ok,
	type Result,
	type TaggedError,
} from '@epicenterhq/result';
import type { WhisperingError, WhisperingResult } from '$lib/result';
import { defineMutation } from './_utils';
import { queryClient } from './index';
import { transformationRunKeys } from './transformationRuns';
import { transformationsKeys } from './transformations';

type TransformServiceError = TaggedError<'TransformServiceError'>;

const transformerKeys = {
	transformInput: ['transformer', 'transformInput'] as const,
	transformRecording: ['transformer', 'transformRecording'] as const,
};

export const transformer = {
	transformInput: defineMutation({
		mutationKey: transformerKeys.transformInput,
		resultMutationFn: async ({
			input,
			transformationId,
		}: {
			input: string;
			transformationId: string;
		}): Promise<WhisperingResult<string>> => {
			const getTransformationOutput = async (): Promise<
				Result<string, WhisperingError>
			> => {
				const { data: transformationRun, error: transformationRunError } =
					await runTransformation({
						input,
						transformationId,
						recordingId: null,
					});

				if (transformationRunError)
					return Err({
						name: 'WhisperingError',
						title: '⚠️ Transformation failed',
						description: transformationRunError.message,
						action: { type: 'more-details', error: transformationRunError },
					});

				if (transformationRun.status === 'failed') {
					return Err({
						name: 'WhisperingError',
						title: '⚠️ Transformation failed',
						description: transformationRun.error,
						action: { type: 'more-details', error: transformationRun.error },
					});
				}

				if (!transformationRun.output) {
					return Err({
						name: 'WhisperingError',
						title: '⚠️ Transformation produced no output',
						description: 'The transformation completed but produced no output.',
					});
				}

				return Ok(transformationRun.output);
			};

			const transformationOutputResult = await getTransformationOutput();

			queryClient.invalidateQueries({
				queryKey:
					transformationRunKeys.runsByTransformationId(transformationId),
			});
			queryClient.invalidateQueries({
				queryKey: transformationsKeys.byId(transformationId),
			});

			return transformationOutputResult;
		},
	}),

	transformRecording: defineMutation({
		mutationKey: transformerKeys.transformRecording,
		resultMutationFn: async ({
			recordingId,
			transformationId,
		}: {
			recordingId: string;
			transformationId: string;
		}): Promise<
			Result<
				TransformationRunCompleted | TransformationRunFailed,
				WhisperingError
			>
		> => {
			const { data: recording, error: getRecordingError } =
				await services.db.getRecordingById(recordingId);
			if (getRecordingError || !recording) {
				return Err({
					name: 'WhisperingError',
					title: '⚠️ Recording not found',
					description: 'Could not find the selected recording.',
				});
			}

			const { data: transformationRun, error: transformationRunError } =
				await runTransformation({
					input: recording.transcribedText,
					transformationId,
					recordingId,
				});

			if (transformationRunError)
				return Err({
					name: 'WhisperingError',
					title: '⚠️ Transformation failed',
					description: transformationRunError.message,
					action: { type: 'more-details', error: transformationRunError },
				});

			queryClient.invalidateQueries({
				queryKey: transformationRunKeys.runsByRecordingId(recordingId),
			});
			queryClient.invalidateQueries({
				queryKey:
					transformationRunKeys.runsByTransformationId(transformationId),
			});
			queryClient.invalidateQueries({
				queryKey: transformationsKeys.byId(transformationId),
			});

			return Ok(transformationRun);
		},
	}),
};

async function handleStep({
	input,
	step,
}: {
	input: string;
	step: TransformationStep;
}): Promise<Result<string, string>> {
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
						await services.completions.openai.complete({
							apiKey: settings.value['apiKeys.openai'],
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
					const model = step['prompt_transform.inference.provider.Groq.model'];
					const { data: completionResponse, error: completionError } =
						await services.completions.groq.complete({
							apiKey: settings.value['apiKeys.groq'],
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
						await services.completions.anthropic.complete({
							apiKey: settings.value['apiKeys.anthropic'],
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
						await services.completions.google.complete({
							apiKey: settings.value['apiKeys.google'],
							model: step['prompt_transform.inference.provider.Google.model'],
							systemPrompt,
							userPrompt,
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
}

async function runTransformation({
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
> {
	if (!input.trim()) {
		return Err({
			name: 'TransformServiceError',
			message: 'Empty input. Please enter some text to transform',
			cause: undefined,
			context: { input, transformationId },
		});
	}
	const { data: transformation, error: getTransformationError } =
		await services.db.getTransformationById(transformationId);
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
		await services.db.createTransformationRun({
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
		} = await services.db.addTransformationStep({
			run: transformationRun,
			step: {
				id: step.id,
				input: currentInput,
			},
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
		});

		if (isErr(handleStepResult)) {
			const {
				data: markedFailedTransformationRun,
				error: markTransformationRunAndRunStepAsFailedError,
			} = await services.db.failTransformationAtStepRun({
				run: transformationRun,
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
						stepId: newTransformationStepRun.id,
						error: handleStepResult.error,
						markTransformationRunAndRunStepAsFailedError,
					},
				});
			return Ok(markedFailedTransformationRun);
		}

		const handleStepOutput = handleStepResult.data;

		const { error: markTransformationRunStepAsCompletedError } =
			await services.db.completeTransformationStepRun({
				run: transformationRun,
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
	} = await services.db.completeTransformation({
		run: transformationRun,
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
}
