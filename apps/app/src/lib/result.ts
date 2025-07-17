import type { UnifiedNotificationOptions } from '$lib/services/notifications/types';
import type { TaggedError } from 'wellcrafted/error';
import { Err, type Ok } from 'wellcrafted/result';

export type WhisperingError = Omit<
	TaggedError<'WhisperingError'>,
	'message' | 'cause' | 'context'
> &
	Omit<UnifiedNotificationOptions, 'variant'> & {
		severity: 'error' | 'warning';
	};

const WhisperingError = (
	args: Omit<WhisperingError, 'name' | 'severity'>,
): WhisperingError => ({
	name: 'WhisperingError',
	severity: 'error',
	...args,
});

export const WhisperingErr = (
	args: Omit<WhisperingError, 'name' | 'severity'>,
) => Err(WhisperingError(args));

const WhisperingWarning = (
	args: Omit<WhisperingError, 'name' | 'severity'>,
): WhisperingError => ({
	name: 'WhisperingError',
	severity: 'warning',
	...args,
});

export const WhisperingWarningErr = (
	args: Omit<WhisperingError, 'name' | 'severity'>,
) => Err(WhisperingWarning(args));

export type WhisperingResult<T> = Ok<T> | Err<WhisperingError>;

export type MaybePromise<T> = T | Promise<T>;
