import { createResultMutation, playSoundIfEnabled } from '$lib/services';
import { RunTransformationService } from '$lib/services/index.js';
import { TransformErrorToWhisperingErr } from '$lib/services/runTransformation';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok } from '@epicenterhq/result';
import { WhisperingError, type WhisperingResult } from '@repo/shared';
import { getContext, setContext } from 'svelte';
import { queryClient } from '..';
import { transformationRunKeys } from '../transformationRuns/queries';
import { transformationsKeys } from '../transformations/queries';
import { maybeCopyAndPaste } from './maybeCopyAndPaste';

export type Transformer = ReturnType<typeof createTransformer>;

export const initTransformerInContext = () => {
	const transformer = createTransformer();
	setContext('transformer', transformer);
	return transformer;
};

export const getTransformerFromContext = () => {
	return getContext<Transformer>('transformer');
};

const transformerKeys = {
	transformInput: ['transformer', 'transformInput'] as const,
	transformRecording: ['transformer', 'transformRecording'] as const,
};

export function createTransformer() {
	const transformInput = createResultMutation(() => ({
		mutationKey: transformerKeys.transformInput,
		onMutate: ({ toastId }) => {
			toast.loading({
				id: toastId,
				title: '🔄 Running transformation...',
				description: 'Applying your selected transformation to the input...',
			});
		},
		mutationFn: async ({
			input,
			transformationId,
		}: {
			input: string;
			transformationId: string;
			toastId: string;
		}): Promise<WhisperingResult<string>> => {
			const { data: transformationRun, error: transformationRunError } =
				await RunTransformationService.transformInput({
					input,
					transformationId,
				});

			if (transformationRunError) {
				return TransformErrorToWhisperingErr(Err(transformationRunError));
			}

			if (transformationRun.error) {
				return Err(
					WhisperingError({
						title: '⚠️ Transformation failed',
						description: transformationRun.error,
						action: { type: 'more-details', error: transformationRun.error },
					}),
				);
			}

			if (!transformationRun.output) {
				return Err(
					WhisperingError({
						title: '⚠️ Transformation produced no output',
						description: 'The transformation completed but produced no output.',
					}),
				);
			}

			return Ok(transformationRun.output);
		},
		onError: (error, { toastId }) => {
			toast.error({ id: toastId, ...error });
		},
		onSuccess: (output, { toastId }) => {
			void playSoundIfEnabled('transformationComplete');
			maybeCopyAndPaste({
				text: output,
				toastId,
				shouldCopy: settings.value['transformation.clipboard.copyOnSuccess'],
				shouldPaste: settings.value['transformation.clipboard.pasteOnSuccess'],
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
		},
		onSettled: (_data, _error, { transformationId }) => {
			queryClient.invalidateQueries({
				queryKey:
					transformationRunKeys.runsByTransformationId(transformationId),
			});
			queryClient.invalidateQueries({
				queryKey: transformationsKeys.byId(transformationId),
			});
		},
	}));
	const transformRecording = createResultMutation(() => ({
		mutationKey: transformerKeys.transformRecording,
		onMutate: ({ toastId }) => {
			toast.loading({
				id: toastId,
				title: '🔄 Running transformation...',
				description:
					'Applying your selected transformation to the transcribed text...',
			});
		},
		mutationFn: async ({
			recordingId,
			transformationId,
		}: {
			recordingId: string;
			transformationId: string;
			toastId: string;
		}): Promise<WhisperingResult<string>> => {
			const { data: transformationRun, error: transformationRunError } =
				await RunTransformationService.transformRecording({
					transformationId,
					recordingId,
				});

			if (transformationRunError) {
				return Err(
					WhisperingError({
						title: '⚠️ Transformation failed',
						description:
							'Failed to apply the transformation on the recording..',
						action: {
							type: 'more-details',
							error: transformationRunError,
						},
					}),
				);
			}

			if (transformationRun.error) {
				return Err(
					WhisperingError({
						title: '⚠️ Transformation error',
						description: 'Failed to apply the transformation on the recording.',
						action: {
							type: 'more-details',
							error: transformationRun.error,
						},
					}),
				);
			}

			if (!transformationRun.output) {
				return Err(
					WhisperingError({
						title: '⚠️ Transformation produced no output',
						description: 'The transformation completed but produced no output.',
					}),
				);
			}

			return Ok(transformationRun.output);
		},
		onError: (error, { toastId }) => {
			toast.error({ id: toastId, ...error });
		},
		onSuccess: (output, { toastId }) => {
			void playSoundIfEnabled('transformationComplete');
			maybeCopyAndPaste({
				text: output,
				toastId,
				shouldCopy: settings.value['transformation.clipboard.copyOnSuccess'],
				shouldPaste: settings.value['transformation.clipboard.pasteOnSuccess'],
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
		},
		onSettled: (_data, _error, { recordingId, transformationId }) => {
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
		},
	}));
	return {
		get isCurrentlyTransforming() {
			return (
				queryClient.isMutating({
					mutationKey: transformerKeys.transformInput,
				}) > 0 ||
				queryClient.isMutating({
					mutationKey: transformerKeys.transformRecording,
				}) > 0
			);
		},
		transformInput,
		transformRecording,
	};
}
