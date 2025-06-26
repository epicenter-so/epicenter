import { Err, Ok, tryAsync } from '@epicenterhq/result';
import type { CompletionService } from './_types';
import OpenAI from 'openai';

export function createOpenAiCompletionService({
	apiKey,
}: {
	apiKey: string;
}): CompletionService {
	const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

	return {
		async complete({ model, systemPrompt, userPrompt }) {
			// Call OpenAI API
			const { data: completion, error: openaiApiError } = await tryAsync({
				try: () =>
					client.chat.completions.create({
						model,
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: userPrompt },
						],
					}),
				mapError: (error) => {
					// Check if it's NOT an OpenAI API error
					if (!(error instanceof OpenAI.APIError)) {
						// This is an unexpected error type
						throw error;
					}
					// Return the error directly
					return error;
				},
			});

			if (openaiApiError) {
				// Error handling follows https://www.npmjs.com/package/openai#error-handling
				const { status, name, message, error } = openaiApiError;

				// 400 - BadRequestError
				if (status === 400) {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							`Invalid request to OpenAI API. ${error?.message ?? ''}`.trim(),
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// 401 - AuthenticationError
				if (status === 401) {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							'Your API key appears to be invalid or expired. Please update your API key in settings.',
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// 403 - PermissionDeniedError
				if (status === 403) {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							"Your account doesn't have access to this model or feature.",
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// 404 - NotFoundError
				if (status === 404) {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							'The requested model was not found. Please check the model name.',
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// 422 - UnprocessableEntityError
				if (status === 422) {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							'The request was valid but the server cannot process it. Please check your parameters.',
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// 429 - RateLimitError
				if (status === 429) {
					return Err({
						name: 'CompletionServiceError',
						message: message ?? 'Too many requests. Please try again later.',
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// >=500 - InternalServerError
				if (status && status >= 500) {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							`The OpenAI service is temporarily unavailable (Error ${status}). Please try again in a few minutes.`,
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// Handle APIConnectionError (no status code)
				if (!status && name === 'APIConnectionError') {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							'Unable to connect to the OpenAI service. This could be a network issue or temporary service interruption.',
						context: { name },
						cause: openaiApiError,
					});
				}

				// Catch-all for unexpected errors
				return Err({
					name: 'CompletionServiceError',
					message: message ?? 'An unexpected error occurred. Please try again.',
					context: { status, name },
					cause: openaiApiError,
				});
			}

			// Extract the response text
			const responseText = completion.choices[0]?.message?.content;
			if (!responseText) {
				return Err({
					name: 'CompletionServiceError',
					message: 'OpenAI API returned an empty response',
					context: {},
					cause: undefined,
				});
			}

			return Ok(responseText);
		},
	};
}
