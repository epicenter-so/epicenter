import type {
	Transformation,
	TransformationRunCompleted,
	TransformationRunFailed,
	TransformationStep,
} from '$lib/services/db';

import {
	fromTaggedErr,
	WhisperingErr,
	type WhisperingError,
	type WhisperingResult,
} from '$lib/result';
import * as services from '$lib/services';
import { settings } from '$lib/stores/settings.svelte';
import { createTaggedError, extractErrorMessage } from 'wellcrafted/error';
import { Err, isErr, Ok, type Result } from 'wellcrafted/result';

import { defineMutation, queryClient } from './_client';
import { transformationRunKeys } from './transformation-runs';
import { transformationsKeys } from './transformations';

const { TransformServiceErr, TransformServiceError } = createTaggedError(
	'TransformServiceError',
);
type TransformServiceError = ReturnType<typeof TransformServiceError>;

const transformerKeys = {
	transformInput: ['transformer', 'transformInput'] as const,
	transformRecording: ['transformer', 'transformRecording'] as const,
};

export const transformer = {
	transformInput: defineMutation({
		mutationKey: transformerKeys.transformInput,
		resultMutationFn: async ({
			input,
			transformation,
		}: {
			input: string;
			transformation: Transformation;
		}): Promise<WhisperingResult<string>> => {
			const getTransformationOutput = async (): Promise<
				Result<string, WhisperingError>
			> => {
				const { data: transformationRun, error: transformationRunError } =
					await runTransformation({
						input,
						recordingId: null,
						transformation,
					});

				if (transformationRunError)
					return fromTaggedErr(transformationRunError, {
						title: '⚠️ Transformation failed',
						action: { error: transformationRunError, type: 'more-details' },
					});

				if (transformationRun.status === 'failed') {
					return WhisperingErr({
						title: '⚠️ Transformation failed',
						description: transformationRun.error,
						action: { error: transformationRun.error, type: 'more-details' },
					});
				}

				if (!transformationRun.output) {
					return WhisperingErr({
						title: '⚠️ Transformation produced no output',
						description: 'The transformation completed but produced no output.',
					});
				}

				return Ok(transformationRun.output);
			};

			const transformationOutputResult = await getTransformationOutput();

			queryClient.invalidateQueries({
				queryKey: transformationRunKeys.runsByTransformationId(
					transformation.id,
				),
			});
			queryClient.invalidateQueries({
				queryKey: transformationsKeys.byId(transformation.id),
			});

			return transformationOutputResult;
		},
	}),

	transformRecording: defineMutation({
		mutationKey: transformerKeys.transformRecording,
		resultMutationFn: async ({
			recordingId,
			transformation,
		}: {
			recordingId: string;
			transformation: Transformation;
		}): Promise<
			Result<
				TransformationRunCompleted | TransformationRunFailed,
				WhisperingError
			>
		> => {
			const { data: recording, error: getRecordingError } =
				await services.db.getRecordingById(recordingId);
			if (getRecordingError || !recording) {
				return WhisperingErr({
					title: '⚠️ Recording not found',
					description:
						getRecordingError?.message ??
						'Could not find the selected recording.',
				});
			}

			const { data: transformationRun, error: transformationRunError } =
				await runTransformation({
					input: recording.transcribedText,
					recordingId,
					transformation,
				});

			if (transformationRunError)
				return fromTaggedErr(transformationRunError, {
					title: '⚠️ Transformation failed',
					action: { error: transformationRunError, type: 'more-details' },
				});

			queryClient.invalidateQueries({
				queryKey: transformationRunKeys.runsByRecordingId(recordingId),
			});
			queryClient.invalidateQueries({
				queryKey: transformationRunKeys.runsByTransformationId(
					transformation.id,
				),
			});
			queryClient.invalidateQueries({
				queryKey: transformationsKeys.byId(transformation.id),
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

				case 'OpenAI': {
					const { data: completionResponse, error: completionError } =
						await services.completions.openai.complete({
							apiKey: settings.value['apiKeys.openai'],
							model: step['prompt_transform.inference.provider.OpenAI.model'],
							systemPrompt,
							userPrompt,
						});

					if (completionError) {
						return Err(completionError.message);
					}

					return Ok(completionResponse);
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
	recordingId,
	transformation,
}: {
	input: string;
	recordingId: null | string;
	transformation: Transformation;
}): Promise<
	Result<
		TransformationRunCompleted | TransformationRunFailed,
		TransformServiceError
	>
> {
	if (!input.trim()) {
		return TransformServiceErr({
			cause: undefined,
			context: { input, transformationId: transformation.id },
			message: 'Empty input. Please enter some text to transform',
		});
	}

	if (transformation.steps.length === 0) {
		return TransformServiceErr({
			cause: undefined,
			context: { transformation },
			message:
				'No steps configured. Please add at least one transformation step',
		});
	}

	const { data: transformationRun, error: createTransformationRunError } =
		await services.db.createTransformationRun({
			input,
			recordingId,
			transformationId: transformation.id,
		});

	if (createTransformationRunError)
		return TransformServiceErr({
			cause: createTransformationRunError,
			context: {
				createTransformationRunError,
				input,
				recordingId,
				transformationId: transformation.id,
			},
			message: 'Unable to start transformation run',
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
			return TransformServiceErr({
				cause: addTransformationStepRunError,
				context: {
					addTransformationStepRunError,
					input: currentInput,
					stepId: step.id,
					transformationRun,
				},
				message: 'Unable to initialize transformation step',
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
				error: handleStepResult.error,
				run: transformationRun,
				stepRunId: newTransformationStepRun.id,
			});
			if (markTransformationRunAndRunStepAsFailedError)
				return TransformServiceErr({
					cause: markTransformationRunAndRunStepAsFailedError,
					context: {
						error: handleStepResult.error,
						markTransformationRunAndRunStepAsFailedError,
						stepId: newTransformationStepRun.id,
						transformationRun,
					},
					message: 'Unable to save failed transformation step result',
				});
			return Ok(markedFailedTransformationRun);
		}

		const handleStepOutput = handleStepResult.data;

		const { error: markTransformationRunStepAsCompletedError } =
			await services.db.completeTransformationStepRun({
				output: handleStepOutput,
				run: transformationRun,
				stepRunId: newTransformationStepRun.id,
			});

		if (markTransformationRunStepAsCompletedError)
			return TransformServiceErr({
				cause: markTransformationRunStepAsCompletedError,
				context: {
					markTransformationRunStepAsCompletedError,
					output: handleStepOutput,
					stepRunId: newTransformationStepRun.id,
					transformationRun,
				},
				message: 'Unable to save completed transformation step result',
			});

		currentInput = handleStepOutput;
	}

	const {
		data: markedCompletedTransformationRun,
		error: markTransformationRunAsCompletedError,
	} = await services.db.completeTransformation({
		output: currentInput,
		run: transformationRun,
	});

	if (markTransformationRunAsCompletedError)
		return TransformServiceErr({
			cause: markTransformationRunAsCompletedError,
			context: {
				markTransformationRunAsCompletedError,
				output: currentInput,
				transformationRun,
			},
			message: 'Unable to save completed transformation run',
		});
	return Ok(markedCompletedTransformationRun);
}
