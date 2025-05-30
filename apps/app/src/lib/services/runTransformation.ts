import { settings } from '$lib/stores/settings.svelte';
import { getErrorMessage } from '$lib/utils';
import { Err, Ok, type Result, isErr, tryAsync } from '@epicenterhq/result';
import { GoogleGenerativeAI, Outcome } from '@google/generative-ai';
import { WhisperingError, type WhisperingResult } from '@repo/shared';
import { z } from 'zod';
import { DbRecordingsService } from '.';
import type {
	DbTransformationsService,
	TransformationRun,
	TransformationStep,
} from './db';
import type { HttpService } from './http/HttpService';

type TransformErrorProperties = {
	_tag: 'TransformError';
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
				}),
			);
		case 'RECORDING_NOT_FOUND':
			return Err(
				WhisperingError({
					title: '⚠️ Recording not found',
					description: 'Could not find the selected recording.',
				}),
			);
		case 'TRANSFORMATION_NOT_FOUND':
			return Err(
				WhisperingError({
					title: '⚠️ Transformation not found',
					description: 'Could not find the selected transformation.',
				}),
			);
		case 'NO_STEPS_CONFIGURED':
			return Err(
				WhisperingError({
					title: 'No steps configured',
					description: 'Please add at least one transformation step',
				}),
			);
		case 'FAILED_TO_CREATE_TRANSFORMATION_RUN':
			return Err(
				WhisperingError({
					title: '⚠️ Failed to create transformation run',
					description: 'Could not create the transformation run.',
				}),
			);
		case 'FAILED_TO_ADD_TRANSFORMATION_STEP_RUN':
			return Err(
				WhisperingError({
					title: '⚠️ Failed to add transformation step run',
					description: 'Could not add the transformation step run.',
				}),
			);
		case 'FAILED_TO_MARK_TRANSFORMATION_RUN_AND_STEP_AS_FAILED':
			return Err(
				WhisperingError({
					title: '⚠️ Failed to mark transformation run and step as failed',
					description:
						'Could not mark the transformation run and step as failed.',
				}),
			);
		case 'FAILED_TO_MARK_TRANSFORMATION_RUN_STEP_AS_COMPLETED':
			return Err(
				WhisperingError({
					title: '⚠️ Failed to mark transformation run step as completed',
					description:
						'Could not mark the transformation run step as completed.',
				}),
			);
		case 'FAILED_TO_MARK_TRANSFORMATION_RUN_AS_COMPLETED':
			return Err(
				WhisperingError({
					title: '⚠️ Failed to mark transformation run as completed',
					description: 'Could not mark the transformation run as completed.',
				}),
			);
	}
};

export const TransformError = <
	T extends Omit<TransformErrorProperties, '_tag'>,
>(
	properties: T,
) =>
	Err({
		_tag: 'TransformError',
		...properties,
	}) satisfies TransformError;

export function createRunTransformationService({
	DbTransformationsService,
	HttpService,
}: {
	DbTransformationsService: DbTransformationsService;
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
						return Err(`Invalid regex pattern: ${getErrorMessage(error)}`);
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
						const model =
							step['prompt_transform.inference.provider.OpenAI.model'];
						const { data: completionResponse, error: completionError } =
							await HttpService.post({
								url: 'https://api.openai.com/v1/chat/completions',
								headers: {
									'Content-Type': 'application/json',
									Authorization: `Bearer ${settings.value['apiKeys.openai']}`,
								},
								body: JSON.stringify({
									model,
									messages: [
										{ role: 'system', content: systemPrompt },
										{ role: 'user', content: userPrompt },
									],
								}),
								schema: z.object({
									choices: z.array(
										z.object({
											message: z.object({
												content: z.string(),
											}),
										}),
									),
								}),
							});

						if (completionError) {
							const { error, code } = completionError;
							return Err(
								`OpenAI API Error: ${getErrorMessage(error)} (${code})`,
							);
						}

						const responseText =
							completionResponse.choices[0]?.message?.content;
						if (!responseText) {
							return Err('OpenAI API returned an empty response');
						}

						return Ok(responseText);
					}

					case 'Groq': {
						const model =
							step['prompt_transform.inference.provider.Groq.model'];
						const { data: completionResponse, error: completionError } =
							await HttpService.post({
								url: 'https://api.groq.com/openai/v1/chat/completions',
								headers: {
									'Content-Type': 'application/json',
									Authorization: `Bearer ${settings.value['apiKeys.groq']}`,
								},
								body: JSON.stringify({
									model,
									messages: [
										{ role: 'system', content: systemPrompt },
										{ role: 'user', content: userPrompt },
									],
								}),
								schema: z.object({
									choices: z.array(
										z.object({
											message: z.object({
												content: z.string(),
											}),
										}),
									),
								}),
							});

						if (completionError) {
							const { error, code } = completionError;
							return Err(`Groq API Error: ${getErrorMessage(error)} (${code})`);
						}

						const responseText =
							completionResponse.choices[0]?.message?.content;
						if (!responseText) {
							return Err('Groq API returned an empty response');
						}

						return Ok(responseText);
					}

					case 'Anthropic': {
						const model =
							step['prompt_transform.inference.provider.Anthropic.model'];
						const { data: completionResponse, error: completionError } =
							await HttpService.post({
								url: 'https://api.anthropic.com/v1/messages',
								headers: {
									'Content-Type': 'application/json',
									'anthropic-version': '2023-06-01',
									'x-api-key': settings.value['apiKeys.anthropic'],
									'anthropic-dangerous-direct-browser-access': 'true',
								},
								body: JSON.stringify({
									model,
									system: systemPrompt,
									messages: [{ role: 'user', content: userPrompt }],
									max_tokens: 1024,
								}),
								schema: z.object({
									content: z.array(
										z.object({
											type: z.literal('text'),
											text: z.string(),
										}),
									),
								}),
							});

						if (completionError) {
							const { error, code } = completionError;
							return Err(
								`Anthropic API Error: ${getErrorMessage(error)} (${code})`,
							);
						}

						const responseText = completionResponse.content[0]?.text;
						if (!responseText) {
							return Err('Anthropic API returned an empty response');
						}

						return Ok(responseText);
					}

					case 'Google': {
						const combinedPrompt = `${systemPrompt}\n${userPrompt}`;

						const { data: completionResponse, error: completionError } =
							await tryAsync({
								try: async () => {
									const genAI = new GoogleGenerativeAI(
										settings.value['apiKeys.google'],
									);

									const model = genAI.getGenerativeModel({
										model:
											step['prompt_transform.inference.provider.Google.model'],
										generationConfig: { temperature: 0 },
									});
									return await model.generateContent(combinedPrompt);
								},
								mapErr: (error) => {
									return Err(getErrorMessage(error));
								},
							});
						if (completionError) return completionError;

						const responseText = completionResponse.response.text();

						if (!responseText) {
							return Err('Google API returned an empty response');
						}

						return Ok(responseText);
					}

					default:
						return Err(`Unsupported provider: ${provider}`);
				}
			}

			default:
				return Err(`Unsupported step type: ${step.type}`);
		}
	};

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
