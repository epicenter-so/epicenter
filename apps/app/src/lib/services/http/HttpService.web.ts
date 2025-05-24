import { getErrorMessage } from '$lib/utils';
import { Err, tryAsync } from '@epicenterhq/result';
import type { HttpService } from './HttpService';
import { HttpServiceError } from './HttpService';

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
				mapErr: (error) => HttpServiceError({ code: 'NetworkError', error }),
			});
			if (responseError) return Err(responseError);

			if (!response.ok) {
				return Err(
					HttpServiceError({
						code: 'HttpError',
						status: response.status,
						error: getErrorMessage(await response.json()),
					}),
				);
			}
			const parseResult = await tryAsync({
				try: async () => {
					const json = await response.json();
					return schema.parse(json);
				},
				mapErr: (error) => HttpServiceError({ code: 'ParseError', error }),
			});
			return parseResult;
		},
	};
}
