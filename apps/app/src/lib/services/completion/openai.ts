import { Err, Ok } from '@epicenterhq/result';
import { z } from 'zod';
import type { HttpService } from '../http/HttpService';
import type { CompletionService } from './types';

export function createOpenAiCompletionService({
	apiKey,
	HttpService,
}: {
	apiKey: string;
	HttpService: HttpService;
}): CompletionService {
	return {
		complete: async ({ model, systemPrompt, userPrompt }) => {
			const { data: httpResponse, error: httpError } = await HttpService.post({
				url: 'https://api.openai.com/v1/chat/completions',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model,
					messages: [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: userPrompt },
					],
				}),
				schema: z.object({
					choices: z.array(
						z.object({
							message: z.object({
								content: z.string(),
							}),
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

			const responseText = httpResponse.choices[0]?.message?.content;
			if (!responseText) {
				return Err({
					name: 'CompletionServiceError',
					message: 'OpenAI API returned an empty response',
					context: {},
					cause: httpError,
				});
			}

			return Ok(responseText);
		},
	};
}
