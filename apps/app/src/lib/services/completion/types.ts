import type { Result } from 'wellcrafted/result';
import type { TaggedError } from 'wellcrafted/error';

export type CompletionServiceError = TaggedError<'CompletionServiceError'>;

export type CompletionService = {
	complete: (opts: {
		apiKey: string;
		model: string;
		systemPrompt: string;
		userPrompt: string;
	}) => Promise<Result<string, CompletionServiceError>>;
};
