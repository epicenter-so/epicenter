/**
 * Action definition utilities for vault plugins with StandardSchema support
 */

/**
 * StandardSchema v1 specification
 * Compatible with Zod, Valibot, Arktype, and other schema libraries
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
	readonly '~standard': {
		readonly version: 1;
		readonly vendor: string;
		readonly validate: (
			value: unknown
		) => StandardSchemaV1.Result<Output> | Promise<StandardSchemaV1.Result<Output>>;
		readonly types?: {
			readonly input: Input;
			readonly output: Output;
		};
	};
}

export namespace StandardSchemaV1 {
	export type Result<Output> = SuccessResult<Output> | FailureResult;

	export interface SuccessResult<Output> {
		readonly value: Output;
		readonly issues?: undefined;
	}

	export interface FailureResult {
		readonly issues: ReadonlyArray<Issue>;
	}

	export interface Issue {
		readonly message: string;
		readonly path?: ReadonlyArray<PropertyKey | PathSegment>;
	}

	export interface PathSegment {
		readonly key: PropertyKey;
	}

	export type InferInput<Schema extends StandardSchemaV1> = 
		Schema extends StandardSchemaV1<infer I, any> ? I : never;

	export type InferOutput<Schema extends StandardSchemaV1> = 
		Schema extends StandardSchemaV1<any, infer O> ? O : never;
}

export type QueryHandler<TInput, TOutput, TContext = any> = (
	input: TInput,
	context: TContext
) => Promise<TOutput> | TOutput;

export type MutationHandler<TInput, TOutput, TContext = any> = (
	input: TInput,
	context: TContext
) => Promise<TOutput> | TOutput;

export type QueryDefinition<
	TSchema extends StandardSchemaV1 = StandardSchemaV1,
	TOutput = any,
	TContext = any
> = {
	type: 'query';
	input: TSchema;
	handler: QueryHandler<StandardSchemaV1.InferInput<TSchema>, TOutput, TContext>;
};

export type MutationDefinition<
	TSchema extends StandardSchemaV1 = StandardSchemaV1,
	TOutput = any,
	TContext = any
> = {
	type: 'mutation';
	input: TSchema;
	handler: MutationHandler<StandardSchemaV1.InferInput<TSchema>, TOutput, TContext>;
};

export type ActionDefinition = QueryDefinition | MutationDefinition;

/**
 * Define a query action with StandardSchema validation
 * 
 * @example
 * ```typescript
 * import { z } from 'zod';
 * 
 * const getPostsQuery = defineQuery({
 *   input: z.object({
 *     limit: z.number().min(1).max(100),
 *     offset: z.number().min(0).default(0)
 *   }),
 *   handler: async ({ limit, offset }, context) => {
 *     const posts = await context.list();
 *     return posts.slice(offset, offset + limit);
 *   }
 * });
 * ```
 */
export function defineQuery<
	TSchema extends StandardSchemaV1,
	TOutput,
	TContext = any
>({
	input,
	handler,
}: {
	input: TSchema;
	handler: QueryHandler<StandardSchemaV1.InferInput<TSchema>, TOutput, TContext>;
}): QueryDefinition<TSchema, TOutput, TContext> {
	return {
		type: 'query',
		input,
		handler,
	};
}

/**
 * Define a mutation action with StandardSchema validation
 * 
 * @example
 * ```typescript
 * import { type } from 'arktype';
 * 
 * const createPostMutation = defineMutation({
 *   input: type({
 *     title: 'string',
 *     content: 'string',
 *     published: 'boolean = false'
 *   }),
 *   handler: async ({ title, content, published }, context) => {
 *     return await context.create({
 *       title,
 *       content,
 *       published,
 *       createdAt: new Date()
 *     });
 *   }
 * });
 * ```
 */
export function defineMutation<
	TSchema extends StandardSchemaV1,
	TOutput,
	TContext = any
>({
	input,
	handler,
}: {
	input: TSchema;
	handler: MutationHandler<StandardSchemaV1.InferInput<TSchema>, TOutput, TContext>;
}): MutationDefinition<TSchema, TOutput, TContext> {
	return {
		type: 'mutation',
		input,
		handler,
	};
}

/**
 * Validate data against a StandardSchema
 * 
 * @throws Error if validation fails
 */
export async function validateWithSchema<T extends StandardSchemaV1>(
	schema: T,
	data: unknown
): Promise<StandardSchemaV1.InferOutput<T>> {
	const result = schema['~standard'].validate(data);
	const validationResult = result instanceof Promise ? await result : result;
	
	if (validationResult.issues) {
		const messages = validationResult.issues.map(issue => {
			if (issue.path && issue.path.length > 0) {
				const path = issue.path
					.map(segment => 
						typeof segment === 'object' && 'key' in segment 
							? segment.key 
							: segment
					)
					.join('.');
				return `${path}: ${issue.message}`;
			}
			return issue.message;
		});
		
		throw new Error(`Validation failed:\n${messages.join('\n')}`);
	}
	
	return validationResult.value as StandardSchemaV1.InferOutput<T>;
}