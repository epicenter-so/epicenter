import type {
	ANTHROPIC_INFERENCE_MODELS,
	GOOGLE_INFERENCE_MODELS,
	GROQ_INFERENCE_MODELS,
	INFERENCE_PROVIDERS,
	OPENAI_INFERENCE_MODELS,
} from '$lib/constants/inference';

import { nanoid } from 'nanoid/non-secure';

export const TRANSFORMATION_STEP_TYPES = [
	'prompt_transform',
	'find_replace',
] as const;

export const TRANSFORMATION_STEP_TYPES_TO_LABELS = {
	find_replace: 'Find Replace',
	prompt_transform: 'Prompt Transform',
} as const satisfies Record<(typeof TRANSFORMATION_STEP_TYPES)[number], string>;

export type InsertTransformationStep = Omit<
	TransformationStep,
	'createdAt' | 'updatedAt'
>;

export type Transformation = {
	createdAt: string;
	description: string;
	id: string;
	/**
	 * It can be one of several types of text transformations:
	 * - find_replace: Replace text patterns with new text
	 * - prompt_transform: Use AI to transform text based on prompts
	 */
	steps: {
		'find_replace.findText': string;
		'find_replace.replaceText': string;

		'find_replace.useRegex': boolean;
		id: string;
		'prompt_transform.inference.provider': (typeof INFERENCE_PROVIDERS)[number];
		'prompt_transform.inference.provider.Anthropic.model': (typeof ANTHROPIC_INFERENCE_MODELS)[number];
		'prompt_transform.inference.provider.Google.model': (typeof GOOGLE_INFERENCE_MODELS)[number];

		'prompt_transform.inference.provider.Groq.model': (typeof GROQ_INFERENCE_MODELS)[number];
		'prompt_transform.inference.provider.OpenAI.model': (typeof OPENAI_INFERENCE_MODELS)[number];

		'prompt_transform.systemPromptTemplate': string;
		'prompt_transform.userPromptTemplate': string;
		// For now, steps don't need titles or descriptions. They can be computed from the type as "Find and Replace" or "Prompt Transform"
		type: (typeof TRANSFORMATION_STEP_TYPES)[number];
	}[];
	title: string;
	updatedAt: string;
};
export type TransformationStep = Transformation['steps'][number];

export function generateDefaultTransformation(): Transformation {
	const now = new Date().toISOString();
	return {
		title: '',
		description: '',
		createdAt: now,
		id: nanoid(),
		steps: [],
		updatedAt: now,
	};
}

export function generateDefaultTransformationStep(): TransformationStep {
	return {
		'find_replace.findText': '',
		'find_replace.replaceText': '',
		'find_replace.useRegex': false,
		id: nanoid(),
		'prompt_transform.inference.provider': 'Google',
		'prompt_transform.inference.provider.Anthropic.model': 'claude-sonnet-4-0',
		'prompt_transform.inference.provider.Google.model': 'gemini-2.5-flash',

		'prompt_transform.inference.provider.Groq.model': 'llama-3.3-70b-versatile',
		'prompt_transform.inference.provider.OpenAI.model': 'gpt-4o',

		'prompt_transform.systemPromptTemplate': '',
		'prompt_transform.userPromptTemplate': '',
		type: 'prompt_transform',
	};
}
