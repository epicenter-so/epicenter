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

/**
 * Query action - for read operations
 */
export type QueryAction<TInput = any, TOutput = any, TContext = any> = {
	type: 'query';
	input: StandardSchemaV1<TInput>;
	handler: (input: TInput, context: TContext) => Promise<TOutput> | TOutput;
};

/**
 * Mutation action - for write operations
 */
export type MutationAction<TInput = any, TOutput = any, TContext = any> = {
	type: 'mutation';
	input: StandardSchemaV1<TInput>;
	handler: (input: TInput, context: TContext) => Promise<TOutput> | TOutput;
};

/**
 * Union type for all action types
 */
export type Action<TInput = any, TOutput = any, TContext = any> = 
	| QueryAction<TInput, TOutput, TContext>
	| MutationAction<TInput, TOutput, TContext>;


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
	
	if ('issues' in validationResult && validationResult.issues) {
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
	
	return (validationResult as StandardSchemaV1.SuccessResult<StandardSchemaV1.InferOutput<T>>).value;
}