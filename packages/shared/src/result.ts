import type { Err, Ok } from '@epicenterhq/result';
import type { ToastAndNotifyOptions } from './toasts.js';

export type WhisperingError = {
	_tag: 'WhisperingError';
	variant: 'error' | 'warning';
} & Omit<ToastAndNotifyOptions, 'variant'>;

export type WhisperingErr = Err<WhisperingError>;
export type WhisperingResult<T> = Ok<T> | WhisperingErr;

export type MaybePromise<T> = T | Promise<T>;

export const WhisperingWarningProperties = (
	args: Omit<WhisperingError, '_tag' | 'variant'>,
): WhisperingError => ({
	_tag: 'WhisperingError',
	variant: 'warning',
	...args,
});

export const WhisperingError = (
	args: Omit<WhisperingError, '_tag' | 'variant'>,
): WhisperingError => ({
	_tag: 'WhisperingError',
	variant: 'error',
	...args,
});
