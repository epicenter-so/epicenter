/**
 * Database transformation type constants
 */

export const TRANSFORMATION_STEP_TYPES = [
	'prompt_transform',
	'find_replace',
] as const;

export const TRANSFORMATION_STEP_TYPES_TO_LABELS = {
	find_replace: 'Find Replace',
	prompt_transform: 'Prompt Transform',
} as const satisfies Record<(typeof TRANSFORMATION_STEP_TYPES)[number], string>;
