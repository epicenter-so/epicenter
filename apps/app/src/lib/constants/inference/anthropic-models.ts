/**
 * Anthropic inference model constants
 * @see https://docs.anthropic.com/en/docs/about-claude/models/overview#model-aliases
 */

export const ANTHROPIC_INFERENCE_MODELS = [
	'claude-opus-4-0',
	'claude-sonnet-4-0',
	'claude-3-7-sonnet-latest',
] as const;

export const ANTHROPIC_INFERENCE_MODEL_OPTIONS = ANTHROPIC_INFERENCE_MODELS.map(
	(model) => ({
		value: model,
		label: model,
	}),
);
