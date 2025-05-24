import { Err, type Ok, tryAsync } from '@epicenterhq/result';
import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import {
	WhisperingError,
	type WhisperingErr,
	type WhisperingResult,
} from '@repo/shared';
import type {
	OpenWhisperingTabMessage,
	OpenWhisperingTabResult,
} from '~background/messages/extension/openWhisperingTab';
import type { PingResult } from '~background/messages/extension/ping';
import type {
	ClearNotificationMessage,
	ClearNotificationResult,
} from '../background/messages/extension/clearNotification';
import type {
	CreateNotificationMessage,
	CreateNotificationResult,
} from '../background/messages/extension/createNotification';
import type {
	NotifyWhisperingTabReadyMessage,
	NotifyWhisperingTabReadyResult,
} from '../background/messages/extension/notifyWhisperingTabReady';
import type {
	PlaySoundMessage,
	PlaySoundResult,
} from '../background/messages/extension/playSound';
import type {
	SetClipboardTextMessage,
	SetClipboardTextResult,
} from '../background/messages/extension/setClipboardText';
import type {
	SetRecorderStateMessage,
	SetRecorderStateResult,
} from '../background/messages/extension/setRecorderState';
import type {
	WriteTextToCursorMessage,
	WriteTextToCursorResult,
} from '../background/messages/extension/writeTextToCursor';

type SendMessageToExtensionErrProperties = {
	_tag: 'SendMessageToExtensionError';
	name: string;
	body: unknown;
	metadata: Parameters<typeof sendToBackgroundViaRelay>[0];
	error: unknown;
};

type SendMessageToExtensionErr = Err<SendMessageToExtensionErrProperties>;

export type SendMessageToExtensionResult<T> = Ok<T> | SendMessageToExtensionErr;

export const SendMessageToExtensionErr = (
	args: Omit<SendMessageToExtensionErrProperties, '_tag'>,
): SendMessageToExtensionErr =>
	Err({
		_tag: 'SendMessageToExtensionError',
		...args,
	} as const);

const TIMEOUT_SECONDS = 1;

export async function sendMessageToExtension<
	R extends WhisperingResult<unknown>,
>(
	...args: Parameters<typeof sendToBackgroundViaRelay>
): Promise<R | WhisperingErr> {
	const { data: commandAsWhisperingResult, error: sendError } = (await tryAsync(
		{
			try: () => sendToBackgroundViaRelay(...args),
			mapErr: (error) => {
				const { name, body } = args[0];
				return SendMessageToExtensionErr({
					name,
					body,
					metadata: args[0],
					error,
				});
			},
		},
	)) as SendMessageToExtensionResult<R>;

	if (sendError) {
		const { name, body, metadata, error } = sendError;
		return Err(
			WhisperingError({
				title: `Unable to ${name} - Extension Connection Failed`,
				description: `Unable to send "${name}" command to the browser extension's background service worker. This could be due to the extension not being properly initialized or a communication error.`,
				action: {
					type: 'more-details',
					error: { name, body, metadata, error },
				},
			}),
		);
	}
	return commandAsWhisperingResult;
}

const ExtensionNotAvailableErr = () =>
	Err({
		_tag: 'ExtensionNotAvailableError',
	} as const);

export const extension = (() => {
	let isExtensionAvailable = false;

	const checkExtensionAvailability = async () => {
		try {
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => {
					reject(
						new Error(
							`Extension messaging timeout after ${TIMEOUT_SECONDS} seconds`,
						),
					);
				}, TIMEOUT_SECONDS * 1000);
			});

			const pingPromise = sendMessageToExtension<PingResult>({
				name: 'extension/ping',
			});

			await Promise.race([pingPromise, timeoutPromise]);
			isExtensionAvailable = true;
		} catch {
			isExtensionAvailable = false;
			console.warn(
				'Browser extension not available - features will be disabled',
			);
		}
	};

	checkExtensionAvailability();

	return {
		createNotification: async (body: CreateNotificationMessage) => {
			if (!isExtensionAvailable) return ExtensionNotAvailableErr();
			return await sendMessageToExtension<CreateNotificationResult>({
				name: 'extension/createNotification',
				body,
			});
		},
		clearNotification: async (body: ClearNotificationMessage) => {
			if (!isExtensionAvailable) return ExtensionNotAvailableErr();
			return await sendMessageToExtension<ClearNotificationResult>({
				name: 'extension/clearNotification',
				body,
			});
		},
		notifyWhisperingTabReady: async (body: NotifyWhisperingTabReadyMessage) => {
			if (!isExtensionAvailable) return ExtensionNotAvailableErr();
			return await sendMessageToExtension<NotifyWhisperingTabReadyResult>({
				name: 'extension/notifyWhisperingTabReady',
				body,
			});
		},
		openWhisperingTab: async (body: OpenWhisperingTabMessage) => {
			if (!isExtensionAvailable) return ExtensionNotAvailableErr();
			return await sendMessageToExtension<OpenWhisperingTabResult>({
				name: 'extension/openWhisperingTab',
				body,
			});
		},
		playSound: async (body: PlaySoundMessage) => {
			if (!isExtensionAvailable) return ExtensionNotAvailableErr();
			return await sendMessageToExtension<PlaySoundResult>({
				name: 'extension/playSound',
				body,
			});
		},
		setClipboardText: async (body: SetClipboardTextMessage) => {
			if (!isExtensionAvailable) return ExtensionNotAvailableErr();
			return await sendMessageToExtension<SetClipboardTextResult>({
				name: 'extension/setClipboardText',
				body,
			});
		},
		setRecorderState: async (body: SetRecorderStateMessage) => {
			if (!isExtensionAvailable) return ExtensionNotAvailableErr();
			return await sendMessageToExtension<SetRecorderStateResult>({
				name: 'extension/setRecorderState',
				body,
			});
		},
		writeTextToCursor: async (body: WriteTextToCursorMessage) => {
			if (!isExtensionAvailable) return ExtensionNotAvailableErr();
			return await sendMessageToExtension<WriteTextToCursorResult>({
				name: 'extension/writeTextToCursor',
				body,
			});
		},
	};
})();
