import { Err, Ok, extractErrorMessage, tryAsync } from '@epicenterhq/result';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CompletionService, CompletionServiceError } from './_types';

export function createGoogleCompletionService({
	apiKey,
}: {
	apiKey: string;
}): CompletionService {
	return {
		complete: async ({ model: modelName, systemPrompt, userPrompt }) => {
			const combinedPrompt = `${systemPrompt}\n${userPrompt}`;
			const { data: completion, error: completionError } = await tryAsync({
				try: async () => {
					const genAI = new GoogleGenerativeAI(apiKey);

					const model = genAI.getGenerativeModel({
						model: modelName,
						// TODO: Add temperature to step settings
						generationConfig: { temperature: 0 },
					});
					const { response } = await model.generateContent(combinedPrompt);
					return response.text();
				},
				mapError: (error): CompletionServiceError => ({
					name: 'CompletionServiceError',
					message: `Google API Error: ${extractErrorMessage(error)}`,
					context: { model: modelName, systemPrompt, userPrompt },
					cause: error,
				}),
			});

			if (completionError) return Err(completionError);

			if (!completion) {
				return Err({
					name: 'CompletionServiceError',
					message: 'Google API returned an empty response',
					context: { model: modelName, systemPrompt, userPrompt },
					cause: completionError,
				});
			}

			return Ok(completion);
		},
	};
}
