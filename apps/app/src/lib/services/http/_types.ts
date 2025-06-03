import type { Result, TaggedError } from '@epicenterhq/result';
import type { z } from 'zod';

/**
 * Network-level connection failure that prevents the HTTP request from reaching the server.
 *
 * Occurs when there are connectivity issues before any HTTP response is received.
 * Common causes: no internet, DNS failures, server unreachable, timeouts, CORS blocks.
 *
 * @example
 * ```typescript
 * // Network down, bad URL, or server unreachable
 * const result = await httpService.post({ url: 'https://down-server.com/api', ... });
 * // Result: ConnectionError
 * ```
 */
export type ConnectionError = TaggedError<'ConnectionError'>;

/**
 * HTTP response with a non-2xx status code (4xx client errors, 5xx server errors).
 *
 * The server received and processed the request but returned an error status.
 * Check the `status` property and response body for details.
 *
 * @example
 * ```typescript
 * // Bad auth, missing resource, or server error
 * const result = await httpService.post({ url: '/protected-endpoint', ... });
 * // Result: ResponseError with status: 401, 404, 500, etc.
 * ```
 */
export type ResponseError = TaggedError<'ResponseError'> & {
	/** HTTP status code (e.g., 400, 401, 404, 500) */
	status: number;
};

/**
 * Failed to parse the response body as valid JSON or validate against the Zod schema.
 *
 * Server returned 2xx status but the response body is malformed JSON or doesn't match
 * the expected schema structure/types.
 *
 * @example
 * ```typescript
 * // Server returns "{ invalid json }" or { id: "string" } when expecting { id: number }
 * const result = await httpService.post({ schema: z.object({ id: z.number() }), ... });
 * // Result: ParseError
 * ```
 */
export type ParseError = TaggedError<'ParseError'>;

export type HttpServiceError = ConnectionError | ResponseError | ParseError;

export type HttpService = {
	/**
	 * Makes a POST request with automatic JSON parsing and schema validation.
	 *
	 * **Error Handling Strategy:**
	 * 1. **Connection Phase:** Catches network-level failures (ConnectionError)
	 * 2. **Response Phase:** Validates HTTP status codes (ResponseError)
	 * 3. **Parse Phase:** Validates JSON structure and schema (ParseError)
	 */
	post: <TSchema extends z.ZodTypeAny>(config: {
		url: string;
		body: BodyInit | FormData;
		schema: TSchema;
		headers?: Record<string, string>;
	}) => Promise<Result<z.infer<TSchema>, HttpServiceError>>;
};
