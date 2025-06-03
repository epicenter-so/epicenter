import type { Result, TaggedError } from '@epicenterhq/result';

export type CompletionServiceError = TaggedError<'CompletionServiceError'>;

export type CompletionService = {
	complete: (opts: {
		model: string;
		systemPrompt: string;
		userPrompt: string;
	}) => Promise<Result<string, CompletionServiceError>>;
};
