import { Err, Ok, tryAsync } from '@epicenterhq/result';
import type { CompletionService } from './_types';
import Anthropic from '@anthropic-ai/sdk';

export function createAnthropicCompletionService({
	apiKey,
}: {
	apiKey: string;
}): CompletionService {
	const client = new Anthropic({
		apiKey,
		// Enable browser usage
		dangerouslyAllowBrowser: true,
	});

	return {
		async complete({ model, systemPrompt, userPrompt }) {
			// Call Anthropic API
			const { data: completion, error: anthropicApiError } = await tryAsync({
				try: () =>
					client.messages.create({
						model,
						system: systemPrompt,
						messages: [{ role: 'user', content: userPrompt }],
						max_tokens: 1024,
					}),
				mapError: (error) => {
					// Check if it's NOT an Anthropic API error
					if (!(error instanceof Anthropic.APIError)) {
						// This is an unexpected error type
						throw error;
					}
					// Return the error directly
					return error;
				},
			});

			if (anthropicApiError) {
				// Error handling follows https://www.npmjs.com/package/@anthropic-ai/sdk#error-handling
				const { status, name, message, error } = anthropicApiError;

				// 400 - BadRequestError
				if (status === 400) {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							`Invalid request to Anthropic API. ${error?.message ?? ''}`.trim(),
						context: { status, name },
						cause: anthropicApiError,
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
						cause: anthropicApiError,
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
						cause: anthropicApiError,
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
						cause: anthropicApiError,
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
						cause: anthropicApiError,
					});
				}

				// 429 - RateLimitError
				if (status === 429) {
					return Err({
						name: 'CompletionServiceError',
						message: message ?? 'Too many requests. Please try again later.',
						context: { status, name },
						cause: anthropicApiError,
					});
				}

				// >=500 - InternalServerError
				if (status && status >= 500) {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							`The Anthropic service is temporarily unavailable (Error ${status}). Please try again in a few minutes.`,
						context: { status, name },
						cause: anthropicApiError,
					});
				}

				// Handle APIConnectionError (no status code)
				if (!status && name === 'APIConnectionError') {
					return Err({
						name: 'CompletionServiceError',
						message:
							message ??
							'Unable to connect to the Anthropic service. This could be a network issue or temporary service interruption.',
						context: { name },
						cause: anthropicApiError,
					});
				}

				// Catch-all for unexpected errors
				return Err({
					name: 'CompletionServiceError',
					message: message ?? 'An unexpected error occurred. Please try again.',
					context: { status, name },
					cause: anthropicApiError,
				});
			}

			// Extract the response text
			const responseText = completion.content
				.filter((block) => block.type === 'text')
				.map((block) => block.text)
				.join('');

			if (!responseText) {
				return Err({
					name: 'CompletionServiceError',
					message: 'Anthropic API returned an empty response',
					context: {},
					cause: undefined,
				});
			}

			return Ok(responseText);
		},
	};
}
