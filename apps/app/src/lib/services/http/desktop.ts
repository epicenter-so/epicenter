import { fetch } from '@tauri-apps/plugin-http';
import { extractErrorMessage } from 'wellcrafted/error';
import { Err, tryAsync } from 'wellcrafted/result';
import type { HttpService } from '.';
import { ConnectionError, ParseError, ResponseError } from './types';

export function createHttpServiceDesktop(): HttpService {
	return {
		async post({ body, url, schema, headers }) {
			const { data: response, error: responseError } = await tryAsync({
				try: () =>
					fetch(url, {
						method: 'POST',
						body,
						headers: headers,
					}),
				mapError: (error) =>
					ConnectionError({
						message: 'Failed to establish connection',
						context: { url, body, headers },
						cause: error,
					}),
			});
			if (responseError) return Err(responseError);

			if (!response.ok) {
				return Err(
					ResponseError({
						status: response.status,
						message: extractErrorMessage(await response.json()),
						context: { url, body, headers },
						cause: responseError,
					}),
				);
			}

			const parseResult = await tryAsync({
				try: async () => {
					const json = await response.json();
					return schema.parse(json);
				},
				mapError: (error) =>
					ParseError({
						message: 'Failed to parse response',
						context: { url, body, headers },
						cause: error,
					}),
			});
			return parseResult;
		},
	};
}
