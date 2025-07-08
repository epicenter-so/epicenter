/**
 * Groq inference model constants
 * @see https://console.groq.com/docs/models
 */

export const GROQ_INFERENCE_MODELS = [
	// Production models
	'gemma2-9b-it',
	'meta-llama/llama-guard-4-12b',
	'llama-3.3-70b-versatile',
	'llama-3.1-8b-instant',
	// Preview models
	'deepseek-r1-distill-llama-70b',
	'meta-llama/llama-4-maverick-17b-128e-instruct',
	'meta-llama/llama-4-scout-17b-16e-instruct',
	'meta-llama/llama-prompt-guard-2-22m',
	'meta-llama/llama-prompt-guard-2-86m',
	'mistral-saba-24bqwen-qwq-32b',
	'qwen-qwq-32b',
	'qwen/qwen3-32b',
] as const;

export const GROQ_INFERENCE_MODEL_OPTIONS = GROQ_INFERENCE_MODELS.map(
	(model) => ({
		value: model,
		label: model,
	}),
);
