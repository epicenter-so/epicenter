import { Err, Ok, tryAsync } from '@epicenterhq/result';
import type { CompletionService } from './_types';
import Groq from 'groq-sdk';

export function createGroqCompletionService({
	apiKey,
}: {
	apiKey: string;
}): CompletionService {
	const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });

	return {
		async complete({ model, systemPrompt, userPrompt }) {
			// Call Groq API
			const { data: completion, error: groqApiError } = await tryAsync({
				try: () =>
					client.chat.completions.create({
						model,
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: userPrompt },
						],
					}),
				mapError: (error) => {
					// Check if it's NOT a Groq API error
					if (!(error instanceof Groq.APIError)) {
						// This is an unexpected error type
						throw error;
					}
					// Return the error directly
					return error;
				},
			});

			if (groqApiError) {
				// Error handling follows https://www.npmjs.com/package/groq-sdk#error-handling
				const { status, name, message, error } = groqApiError;

				// 400 - BadRequestError
				if (status === 400) {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							`Invalid request to Groq API. ${error?.message ?? ''}`.trim(),
						context: { status, name },
						cause: groqApiError,
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
						cause: groqApiError,
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
						cause: groqApiError,
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
						cause: groqApiError,
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
						cause: groqApiError,
					});
				}

				// 429 - RateLimitError
				if (status === 429) {
					return Err({
						name: 'CompletionServiceError',
						message: message ?? 'Too many requests. Please try again later.',
						context: { status, name },
						cause: groqApiError,
					});
				}

				// >=500 - InternalServerError
				if (status && status >= 500) {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							`The Groq service is temporarily unavailable (Error ${status}). Please try again in a few minutes.`,
						context: { status, name },
						cause: groqApiError,
					});
				}

				// Handle APIConnectionError (no status code)
				if (!status && name === 'APIConnectionError') {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							'Unable to connect to the Groq service. This could be a network issue or temporary service interruption.',
						context: { name },
						cause: groqApiError,
					});
				}

				// Catch-all for unexpected errors
				return Err({
					name: 'CompletionServiceError',
					message: message ?? 'An unexpected error occurred. Please try again.',
					context: { status, name },
					cause: groqApiError,
				});
			}

			// Extract the response text
			const responseText = completion.choices[0]?.message?.content;
			if (!responseText) {
				return Err({
					name: 'CompletionServiceError',
					message: 'Groq API returned an empty response',
					context: {},
					cause: undefined,
				});
			}

			return Ok(responseText);
		},
	};
}