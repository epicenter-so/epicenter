import { createTaggedError } from 'wellcrafted/error';
import type { Result } from 'wellcrafted/result';

const { CompletionServiceError, CompletionServiceErr } = createTaggedError(
	'CompletionServiceError',
);
export type CompletionServiceError = ReturnType<typeof CompletionServiceError>;
export { type CompletionServiceError, CompletionServiceErr };

export type CompletionService = {
	complete: (opts: {
		apiKey: string;
		model: string;
		systemPrompt: string;
		userPrompt: string;
	}) => Promise<Result<string, CompletionServiceError>>;
};
