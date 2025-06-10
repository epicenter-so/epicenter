import { playSoundIfEnabled } from '$lib/services';
import { RunTransformationService } from '$lib/services/index.js';
import { TransformErrorToWhisperingErr } from '$lib/services/runTransformation';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, type Result, isErr } from '@epicenterhq/result';
import type { WhisperingError, WhisperingResult } from '@repo/shared';
import { queryClient } from '.';
import { maybeCopyAndPaste } from './singletons/maybeCopyAndPaste';
import { transformationRunKeys } from './transformationRuns';
import { transformationsKeys } from './transformations';

const transformerKeys = {
	transformInput: ['transformer', 'transformInput'] as const,
	transformRecording: ['transformer', 'transformRecording'] as const,
};

export const transformer = {
	transformInput: {
		mutationKey: transformerKeys.transformInput,
		mutationFn: async ({
			input,
			transformationId,
			toastId,
		}: {
			input: string;
			transformationId: string;
			toastId: string;
		}): Promise<WhisperingResult<string>> => {
			toast.loading({
				id: toastId,
				title: '🔄 Running transformation...',
				description: 'Applying your selected transformation to the input...',
			});

			const getTransformationOutput = async (): Promise<
				Result<string, WhisperingError>
			> => {
				const { data: transformationRun, error: transformationRunError } =
					await RunTransformationService.transformInput({
						input,
						transformationId,
					});

				if (transformationRunError) {
					return TransformErrorToWhisperingErr(Err(transformationRunError));
				}

				if (transformationRun.error) {
					return Err({
						name: 'WhisperingError',
						title: '⚠️ Transformation failed',
						description: transformationRun.error,
						action: { type: 'more-details', error: transformationRun.error },
						context: {},
						cause: transformationRun.error,
					});
				}

				if (!transformationRun.output) {
					return Err({
						name: 'WhisperingError',
						title: '⚠️ Transformation produced no output',
						description: 'The transformation completed but produced no output.',
						context: {},
						cause: transformationRun.error,
					});
				}

				return Ok(transformationRun.output);
			};

			const transformationOutputResult = await getTransformationOutput();

			if (isErr(transformationOutputResult)) {
				toast.error({ id: toastId, ...transformationOutputResult.error });
			} else {
				const output = transformationOutputResult.data;
				playSoundIfEnabled('transformationComplete');
				maybeCopyAndPaste({
					text: output,
					toastId,
					shouldCopy: settings.value['transformation.clipboard.copyOnSuccess'],
					shouldPaste:
						settings.value['transformation.clipboard.pasteOnSuccess'],
					statusToToastText: (status) => {
						switch (status) {
							case null:
								return '🔄 Transformation complete!';
							case 'COPIED':
								return '🔄 Transformation complete and copied to clipboard!';
							case 'COPIED+PASTED':
								return '🔄 Transformation complete, copied to clipboard, and pasted!';
						}
					},
				});
			}

			queryClient.invalidateQueries({
				queryKey:
					transformationRunKeys.runsByTransformationId(transformationId),
			});
			queryClient.invalidateQueries({
				queryKey: transformationsKeys.byId(transformationId),
			});

			return transformationOutputResult;
		},
	},

	transformRecording: {
		mutationKey: transformerKeys.transformRecording,
		mutationFn: async ({
			recordingId,
			transformationId,
			toastId,
		}: {
			recordingId: string;
			transformationId: string;
			toastId: string;
		}): Promise<WhisperingResult<string>> => {
			toast.loading({
				id: toastId,
				title: '🔄 Running transformation...',
				description:
					'Applying your selected transformation to the transcribed text...',
			});

			const getTransformationOutput = async (): Promise<
				Result<string, WhisperingError>
			> => {
				const { data: transformationRun, error: transformationRunError } =
					await RunTransformationService.transformRecording({
						transformationId,
						recordingId,
					});

				if (transformationRunError) {
					return Err({
						name: 'WhisperingError',
						title: '⚠️ Transformation failed',
						description:
							'Failed to apply the transformation on the recording..',
						action: {
							type: 'more-details',
							error: transformationRunError,
						},
						context: {},
						cause: transformationRunError,
					});
				}

				if (transformationRun.error) {
					return Err({
						name: 'WhisperingError',
						title: '⚠️ Transformation error',
						description: 'Failed to apply the transformation on the recording.',
						action: {
							type: 'more-details',
							error: transformationRun.error,
						},
						context: {},
						cause: transformationRun.error,
					});
				}

				if (!transformationRun.output) {
					return Err({
						name: 'WhisperingError',
						title: '⚠️ Transformation produced no output',
						description: 'The transformation completed but produced no output.',
						context: {},
						cause: transformationRun.error,
					});
				}

				return Ok(transformationRun.output);
			};

			const transformationOutputResult = await getTransformationOutput();

			if (isErr(transformationOutputResult)) {
				toast.error({ id: toastId, ...transformationOutputResult.error });
			} else {
				const output = transformationOutputResult.data;
				playSoundIfEnabled('transformationComplete');
				maybeCopyAndPaste({
					text: output,
					toastId,
					shouldCopy: settings.value['transformation.clipboard.copyOnSuccess'],
					shouldPaste:
						settings.value['transformation.clipboard.pasteOnSuccess'],
					statusToToastText: (status) => {
						switch (status) {
							case null:
								return '🔄 Transformation complete!';
							case 'COPIED':
								return '🔄 Transformation complete and copied to clipboard!';
							case 'COPIED+PASTED':
								return '🔄 Transformation complete, copied to clipboard, and pasted!';
						}
					},
				});
			}

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

			return transformationOutputResult;
		},
	},
};
