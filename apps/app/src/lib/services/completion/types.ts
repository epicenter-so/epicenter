import type { Result } from 'wellcrafted/result';
import { createTaggedError } from 'wellcrafted/error';

const { CompletionServiceError, CompletionServiceErr } =
	createTaggedError('CompletionServiceError');
export type CompletionServiceError = ReturnType<typeof CompletionServiceError>;
export { CompletionServiceError, CompletionServiceErr };

export type CompletionService = {
	complete: (opts: {
		apiKey: string;
		model: string;
		systemPrompt: string;
		userPrompt: string;
	}) => Promise<Result<string, CompletionServiceError>>;
};
