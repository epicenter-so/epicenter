import { browser } from '$app/environment';
import type { Result } from '@epicenterhq/result';
import {
	type InitialDataFunction,
	type MutationOptions,
	QueryClient,
	type QueryFunction,
} from '@tanstack/svelte-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			enabled: browser,
		},
	},
});

/**
 * Creates a query definition with both options for reactive usage and methods for programmatic cache access.
 * This follows the same factory pattern as defineMutation to provide a consistent interface.
 *
 * @template TQueryFnData - The type of data returned by the query function
 * @template TError - The type of error that can be thrown
 * @template TData - The type of data returned by the query (after select transform)
 * @template TQueryKey - The type of the query key
 * @param options - Required query options with queryFn and queryKey
 * @returns Object with methods for reactive usage and programmatic cache access
 *
 * @example
 * ```typescript
 * const userQuery = defineQuery({
 *   queryKey: ['users', userId],
 *   queryFn: () => api.getUser(userId)
 * });
 *
 * // Reactive usage
 * const queryOptions = userQuery.options();
 *
 * // Programmatic cache access
 * const cachedData = userQuery.getCached();
 * const hasData = userQuery.hasCached();
 * const freshData = await userQuery.fetchCached();
 * ```
 */
export function defineQuery<
	TQueryFnData = unknown,
	TError = Error,
	TData = TQueryFnData,
	TQueryKey extends readonly unknown[] = readonly unknown[],
>(options: {
	queryKey: TQueryKey;
	queryFn: QueryFunction<Result<TQueryFnData, TError>, TQueryKey, never>;
	initialData?: NoInfer<TData> | InitialDataFunction<NoInfer<TData>>;
	initialDataUpdatedAt?: number | (() => number | undefined);
	select?: (data: TQueryFnData) => TData;
}) {
	return {
		/**
		 * Returns the query options for reactive usage with TanStack Query hooks.
		 * @returns The query options object
		 */
		options: () => options,

		/**
		 * Fetches data for this query, returning cached data if fresh or refetching if stale/missing.
		 * This is the recommended method for programmatic data access.
		 * @returns Promise that resolves with the query data
		 */
		async fetchCached(): Promise<Result<TData, TError>> {
			return queryClient.fetchQuery({
				queryKey: options.queryKey,
				queryFn: options.queryFn,
			});
		},
	};
}

/**
 * Creates a mutation definition with both options for reactive usage and execute method for imperative usage.
 * This follows the factory pattern to provide a consistent interface for mutations.
 *
 * @template TData - The type of data returned by the mutation
 * @template TError - The type of error that can be thrown
 * @template TVariables - The type of variables passed to the mutation
 * @template TContext - The type of context data
 * @param options - Required mutation options with mutationFn and mutationKey
 * @returns Object with options() method for reactive usage and execute() method for imperative usage
 *
 * @example
 * ```typescript
 * const createUser = defineMutation({
 *   mutationKey: ['users', 'create'],
 *   mutationFn: async (userData: UserData) => api.createUser(userData)
 * });
 *
 * // Reactive usage
 * const mutationOptions = createUser.options();
 *
 * // Imperative usage
 * const result = await createUser.execute(userData);
 * ```
 */
export function defineMutation<TData, TError, TVariables, TContext>(
	options: Required<
		Pick<
			MutationOptions<TData, TError, TVariables, TContext>,
			'mutationFn' | 'mutationKey'
		>
	>,
) {
	return {
		/**
		 * Returns the mutation options for reactive usage with TanStack Query hooks.
		 * @returns The mutation options object
		 */
		options: () => options,
		/**
		 * Bypasses the reactive mutation hooks and executes the mutation imperatively.
		 * @param args - The variables to pass to the mutation function
		 * @returns Promise that resolves with the mutation result
		 */
		async execute(...args: Parameters<typeof options.mutationFn>) {
			const result = await executeMutation(options, ...args);
			return result;
		},
	};
}

/**
 * Executes a mutation directly using the query client's mutation cache.
 * This bypasses the reactive mutation hooks and executes the mutation imperatively.
 *
 * @template TData - The type of data returned by the mutation
 * @template TError - The type of error that can be thrown
 * @template TVariables - The type of variables passed to the mutation
 * @template TContext - The type of context data
 * @param options - The mutation options including mutationFn and mutationKey
 * @param variables - The variables to pass to the mutation function
 * @returns Promise that resolves with the mutation result
 */
function executeMutation<TData, TError, TVariables, TContext>(
	options: MutationOptions<TData, TError, TVariables, TContext>,
	variables: TVariables,
) {
	const mutation = queryClient.getMutationCache().build(queryClient, options);
	return mutation.execute(variables);
}
