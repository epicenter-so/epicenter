/**
 * Audio bitrate constants and options
 */

export const BITRATE_VALUES_KBPS = [
	'16',
	'32',
	'64',
	'96',
	'128',
	'192',
	'256',
	'320',
] as const;

export const BITRATE_OPTIONS = BITRATE_VALUES_KBPS.map((bitrate) => ({
	label: `${bitrate} kbps`,
	value: bitrate,
}));

export const DEFAULT_BITRATE_KBPS =
	'128' as const satisfies (typeof BITRATE_VALUES_KBPS)[number];
