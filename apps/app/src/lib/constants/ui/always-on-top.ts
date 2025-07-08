/**
 * Window always-on-top behavior options
 */

export const ALWAYS_ON_TOP_VALUES = [
	'Always',
	'When Recording and Transcribing',
	'When Recording',
	'Never',
] as const;

export const ALWAYS_ON_TOP_OPTIONS = ALWAYS_ON_TOP_VALUES.map((option) => ({
	label: option,
	value: option,
}));
