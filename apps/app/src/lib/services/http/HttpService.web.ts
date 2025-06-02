import { Err, extractErrorMessage, tryAsync } from '@epicenterhq/result';
import type { HttpService, NetworkError, ParseError } from './HttpService';

export function createHttpServiceWeb(): HttpService {
	return {
		async post({ body, url, schema, headers }) {
			const { data: response, error: responseError } = await tryAsync({
				try: () =>
					window.fetch(url, {
						method: 'POST',
						body,
						headers,
					}),
				mapErr: (error): NetworkError => ({
					name: 'NetworkError',
					message: 'Network error',
					context: { url, body, headers },
					cause: error,
				}),
			});
			if (responseError) return Err(responseError);

			if (!response.ok) {
				return Err({
					name: 'HttpError',
					status: response.status,
					message: extractErrorMessage(await response.json()),
					context: { url, body, headers },
					cause: responseError,
				});
			}
			const parseResult = await tryAsync({
				try: async () => {
					const json = await response.json();
					return schema.parse(json);
				},
				mapErr: (error): ParseError => ({
					name: 'ParseError',
					message: 'Parse error',
					context: { url, body, headers },
					cause: error,
				}),
			});
			return parseResult;
		},
	};
}
