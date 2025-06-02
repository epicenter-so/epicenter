import type { Result, TaggedError } from '@epicenterhq/result';
import type { z } from 'zod';

export type ConnectionError = TaggedError<'ConnectionError'>;

export type ResponseError = TaggedError<'ResponseError'> & {
	status: number;
};

export type ParseError = TaggedError<'ParseError'>;

export type HttpServiceError = ConnectionError | ResponseError | ParseError;

export type HttpService = {
	post: <TSchema extends z.ZodTypeAny>(config: {
		url: string;
		body: BodyInit | FormData;
		schema: TSchema;
		headers?: Record<string, string>;
	}) => Promise<Result<z.infer<TSchema>, HttpServiceError>>;
};
