import type { Ok } from '@epicenterhq/result';
import type { Err } from '@epicenterhq/result';
import type { z } from 'zod';

type HttpServiceErrCodes =
	| { code: 'NetworkError'; error: unknown }
	| { code: 'HttpError'; error: unknown; status: number }
	| { code: 'ParseError'; error: unknown };

export type HttpServiceError = {
	_tag: 'HttpServiceErr';
	error: unknown;
} & HttpServiceErrCodes;

export type HttpServiceResult<T> = Ok<T> | Err<HttpServiceError>;

export const HttpServiceError = (
	args: {
		error: unknown;
	} & HttpServiceErrCodes,
): HttpServiceError => ({
	_tag: 'HttpServiceErr',
	...args,
});

export type HttpService = {
	post: <TSchema extends z.ZodTypeAny>(config: {
		url: string;
		body: BodyInit | FormData;
		schema: TSchema;
		headers?: Record<string, string>;
	}) => Promise<HttpServiceResult<z.infer<TSchema>>>;
};
