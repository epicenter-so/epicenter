import { Err, type Ok } from 'wellcrafted/result';
import type { TaggedError } from 'wellcrafted/error';
import type { UnifiedNotificationOptions } from '$lib/services/notifications/types';

export type WhisperingWarning = Omit<
	TaggedError<'WhisperingWarning'>,
	'message'
> &
	Omit<UnifiedNotificationOptions, 'variant'>;

export type WhisperingError = Omit<
	TaggedError<'WhisperingError'>,
	'message' | 'cause' | 'context'
> &
	Omit<UnifiedNotificationOptions, 'variant'>;

export const WhisperingError = (
	args: Omit<WhisperingError, 'name'>,
): WhisperingError => ({
	name: 'WhisperingError',
	...args,
});

export const WhisperingErr = (args: Omit<WhisperingError, 'name'>) =>
	Err(WhisperingError(args));

export const WhisperingWarning = (
	args: Omit<WhisperingWarning, 'name'>,
): WhisperingWarning => ({
	name: 'WhisperingWarning',
	...args,
});

export type WhisperingResult<T> = Ok<T> | Err<WhisperingError>;

export type MaybePromise<T> = T | Promise<T>;
