/**
 * Method definition utilities for vault plugins with StandardSchema support
 */

import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Query method - for read operations
 */
export type QueryMethod<TInput = any, TOutput = any, TContext = any> = {
	type: 'query';
	input: StandardSchemaV1<TInput>;
	handler: (input: TInput, context: TContext) => Promise<TOutput> | TOutput;
};

/**
 * Mutation method - for write operations
 */
export type MutationMethod<TInput = any, TOutput = any, TContext = any> = {
	type: 'mutation';
	input: StandardSchemaV1<TInput>;
	handler: (input: TInput, context: TContext) => Promise<TOutput> | TOutput;
};

/**
 * Union type for all method types
 */
export type Method<TInput = any, TOutput = any, TContext = any> =
	| QueryMethod<TInput, TOutput, TContext>
	| MutationMethod<TInput, TOutput, TContext>;

/**
 * Validate data against a StandardSchema
 *
 * @throws Error if validation fails
 */
export async function validateWithSchema<T extends StandardSchemaV1>(
	schema: T,
	data: unknown,
): Promise<StandardSchemaV1.InferOutput<T>> {
	const result = await schema['~standard'].validate(data);

	if ('issues' in result && result.issues) {
		const messages = result.issues.map((issue) => {
			if (issue.path && issue.path.length > 0) {
				const path = issue.path
					.map((segment) =>
						typeof segment === 'object' && 'key' in segment
							? segment.key
							: segment,
					)
					.join('.');
				return `${path}: ${issue.message}`;
			}
			return issue.message;
		});

		throw new Error(`Validation failed:\n${messages.join('\n')}`);
	}

	return (
		result as StandardSchemaV1.SuccessResult<StandardSchemaV1.InferOutput<T>>
	).value;
}
