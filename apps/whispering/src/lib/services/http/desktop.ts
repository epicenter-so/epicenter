import { fetch } from '@tauri-apps/plugin-http';
import { extractErrorMessage } from 'wellcrafted/error';
import { Err, tryAsync } from 'wellcrafted/result';

import type { HttpService } from '.';

import { ConnectionErr, ParseErr, ResponseErr } from './types';

export function createHttpServiceDesktop(): HttpService {
	return {
		async post({ body, headers, schema, url }) {
			const { data: response, error: responseError } = await tryAsync({
				mapErr: (error) =>
					ConnectionErr({
						cause: error,
						context: { body, headers, url },
						message: 'Failed to establish connection',
					}),
				try: () =>
					fetch(url, {
						body,
						headers: headers,
						method: 'POST',
					}),
			});
			if (responseError) return Err(responseError);

			if (!response.ok) {
				return ResponseErr({
					cause: responseError,
					context: { body, headers, url },
					message: extractErrorMessage(await response.json()),
					status: response.status,
				});
			}

			const parseResult = await tryAsync({
				mapErr: (error) =>
					ParseErr({
						cause: error,
						context: { body, headers, url },
						message: 'Failed to parse response',
					}),
				try: async () => {
					const json = await response.json();
					return schema.parse(json);
				},
			});
			return parseResult;
		},
	};
}
