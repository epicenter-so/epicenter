import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractErrorMessage } from 'wellcrafted/error';
import { Err, Ok, tryAsync } from 'wellcrafted/result';

import type { CompletionService } from './types';

import { CompletionServiceErr } from './types';

export type GoogleCompletionService = ReturnType<
	typeof createGoogleCompletionService
>;

export function createGoogleCompletionService(): CompletionService {
	return {
		complete: async ({
			apiKey,
			model: modelName,
			systemPrompt,
			userPrompt,
		}) => {
			const combinedPrompt = `${systemPrompt}\n${userPrompt}`;
			const { data: completion, error: completionError } = await tryAsync({
				mapErr: (error) =>
					CompletionServiceErr({
						cause: error,
						context: { model: modelName, systemPrompt, userPrompt },
						message: `Google API Error: ${extractErrorMessage(error)}`,
					}),
				try: async () => {
					const genAI = new GoogleGenerativeAI(apiKey);

					const model = genAI.getGenerativeModel({
						// TODO: Add temperature to step settings
						generationConfig: { temperature: 0 },
						model: modelName,
					});
					const { response } = await model.generateContent(combinedPrompt);
					return response.text();
				},
			});

			if (completionError) return Err(completionError);

			if (!completion) {
				return CompletionServiceErr({
					cause: completionError,
					context: { model: modelName, systemPrompt, userPrompt },
					message: 'Google API returned an empty response',
				});
			}

			return Ok(completion);
		},
	};
}

export const GoogleCompletionServiceLive = createGoogleCompletionService();
