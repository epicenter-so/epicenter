import { Err, Ok } from '@epicenterhq/result';
import { z } from 'zod';
import type { HttpService } from '$lib/services/http/_types';
import type { CompletionService } from './_types';

export function createAnthropicCompletionService({
	apiKey,
	HttpService,
}: {
	apiKey: string;
	HttpService: HttpService;
}): CompletionService {
	return {
		complete: async ({ model, systemPrompt, userPrompt }) => {
			const { data: httpResponse, error: httpError } = await HttpService.post({
				url: 'https://api.anthropic.com/v1/messages',
				headers: {
					'Content-Type': 'application/json',
					'anthropic-version': '2023-06-01',
					'x-api-key': apiKey,
					'anthropic-dangerous-direct-browser-access': 'true',
				},
				body: JSON.stringify({
					model,
					system: systemPrompt,
					messages: [{ role: 'user', content: userPrompt }],
					max_tokens: 1024,
				}),
				schema: z.object({
					content: z.array(
						z.object({
							type: z.literal('text'),
							text: z.string(),
						}),
					),
				}),
			});

			if (httpError) {
				return Err({
					name: 'CompletionServiceError',
					message: httpError.message,
					context: {},
					cause: httpError,
				});
			}

			const responseText = httpResponse.content[0]?.text;
			if (!responseText) {
				return Err({
					name: 'CompletionServiceError',
					message: 'Anthropic API returned an empty response',
					context: {},
					cause: httpError,
				});
			}

			return Ok(responseText);
		},
	};
}
