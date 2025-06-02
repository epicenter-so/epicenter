import type { Result, TaggedError } from '@epicenterhq/result';
import type { z } from 'zod';

export type NetworkError = TaggedError<'NetworkError'>;

export type HttpError = TaggedError<'HttpError'> & {
	status: number;
};

export type ParseError = TaggedError<'ParseError'>;

export type HttpServiceError = NetworkError | HttpError | ParseError;

export type HttpService = {
	post: <TSchema extends z.ZodTypeAny>(config: {
		url: string;
		body: BodyInit | FormData;
		schema: TSchema;
		headers?: Record<string, string>;
	}) => Promise<Result<z.infer<TSchema>, HttpServiceError>>;
};
