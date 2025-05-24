import { type } from 'arktype';

const BaseErrorSchema = type({
	name: 'string',
	message: 'string',
	context: 'Record<string, unknown>',
	cause: 'unknown',
});
type BaseError = typeof BaseErrorSchema.infer;

export type BrandError<T extends string> = BaseError & {
	readonly name: T;
};

/**
 * Extracts a string message from any thrown value.
 * Handles various error types and formats to ensure a string is always returned.
 */
export function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;

	if (typeof error === 'string') return error;

	if (typeof error === 'object' && error !== null) {
		// Try to get message from object if it exists
		if (
			'message' in error &&
			typeof (error as { message: unknown }).message === 'string'
		) {
			return (error as { message: string }).message;
		}

		// Try to get error from object if it exists
		if (
			'error' in error &&
			typeof (error as { error: unknown }).error === 'string'
		) {
			return (error as { error: string }).error;
		}

		// Try to stringify the object
		try {
			return JSON.stringify(error);
		} catch {
			// If JSON.stringify fails, fall through to default
		}
	}

	// Default fallback for any other type
	return String(error);
}
