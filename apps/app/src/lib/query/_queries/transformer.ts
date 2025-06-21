import { services } from '$lib/services';
import type {
	TransformationRunCompleted,
	TransformationRunFailed,
} from '$lib/services/db';
import { Err, Ok, type Result } from '@epicenterhq/result';
import type { WhisperingError, WhisperingResult } from '$lib/result';
import { defineMutation } from '../_utils';
import { queryClient } from '../index';
import { transformationRunKeys } from './transformationRuns';
import { transformationsKeys } from './transformations';

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
					await services.transformer.runTransformation({
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
						context: {},
						cause: transformationRunError,
					});

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
					cause: getRecordingError || undefined,
					context: { recordingId, transformationId, getRecordingError },
				});
			}

			const { data: transformationRun, error: transformationRunError } =
				await services.transformer.runTransformation({
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
