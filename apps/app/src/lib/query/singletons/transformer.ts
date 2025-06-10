import { createResultMutation } from '@tanstack/svelte-query';
import { getContext, setContext } from 'svelte';
import { queryClient } from '..';

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
	const transformInput = createResultMutation();
	const transformRecording = createResultMutation();
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
