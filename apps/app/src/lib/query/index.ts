import { browser } from '$app/environment';
import { QueryClient, type MutationOptions } from '@tanstack/svelte-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			enabled: browser,
		},
	},
});

export function executeMutation<TData, TError, TVariables, TContext>(
	options: MutationOptions<TData, TError, TVariables, TContext>,
	variables: TVariables,
) {
	const mutation = queryClient.getMutationCache().build(queryClient, options);
	return mutation.execute(variables);
}

export function defineMutation<TData, TError, TVariables, TContext>(
	options: MutationOptions<TData, TError, TVariables, TContext> &
		Required<
			Pick<MutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
		>,
) {
	return {
		options,
		async execute(...args: Parameters<typeof options.mutationFn>) {
			const result = await executeMutation(options, ...args);
			return result;
		},
	};
}
