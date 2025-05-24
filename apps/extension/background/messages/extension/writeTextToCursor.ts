import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';
import { WhisperingError } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getActiveTabId } from '~lib/getActiveTabId';
import { Err } from '@epicenterhq/result';

export type WriteTextToCursorMessage = {
	transcribedText: string;
};

export type WriteTextToCursorResult = WhisperingResult<string>;

const writeTextToCursor = async (
	transcribedText: string,
): Promise<WriteTextToCursorResult> => {
	const { data: activeTabId, error: activeTabIdError } = await getActiveTabId();
	if (activeTabIdError) {
		return Err(
			WhisperingError({
				title: 'Unable to automatically paste transcribed text',
				description: 'Error getting active tab ID',
				action: { type: 'more-details', error: activeTabIdError },
			}),
		);
	}
	if (!activeTabId) {
		return Err(
			WhisperingError({
				title: 'Unable to automatically paste transcribed text',
				description:
					'No active tab ID found to automatically paste the transcribed text. Please try manually pasting from your clipboard',
			}),
		);
	}
	return injectScript<string, [string]>({
		tabId: activeTabId,
		commandName: 'writeTextToCursor',
		func: (text) => {
			const isDiv = (element: Element): element is HTMLDivElement =>
				element.tagName === 'DIV';
			const isContentEditableDiv = (
				element: Element,
			): element is HTMLDivElement =>
				isDiv(element) && element.isContentEditable;
			const isInput = (element: Element): element is HTMLInputElement =>
				element.tagName === 'INPUT';
			const isTextarea = (element: Element): element is HTMLTextAreaElement =>
				element.tagName === 'TEXTAREA';
			const insertTextIntoInputOrTextarea = (
				element: HTMLInputElement | HTMLTextAreaElement,
				text: string,
			): void => {
				const start = element.selectionStart ?? element.value.length;
				const end = element.selectionEnd ?? element.value.length;

				element.value =
					element.value.slice(0, start) + text + element.value.slice(end);
				element.selectionStart = start;
				element.selectionEnd = start + text.length;

				element.dispatchEvent(
					new InputEvent('input', { bubbles: true, cancelable: true }),
				);
			};

			const insertTextIntoEditableElement = (
				element: HTMLDivElement | HTMLInputElement | HTMLTextAreaElement,
				text: string,
			) => {
				if (isInput(element) || isTextarea(element)) {
					insertTextIntoInputOrTextarea(element, text);
				} else if (isContentEditableDiv(element)) {
					try {
						document.execCommand('insertText', false, text);
					} catch (e) {
						// Fallback for older browsers
						const range = document.getSelection().getRangeAt(0);
						range.deleteContents();
						range.insertNode(document.createTextNode(text));
					}
				}
			};

			const activeElement = document.activeElement;
			if (
				!activeElement ||
				(activeElement &&
					!isContentEditableDiv(activeElement) &&
					!isInput(activeElement) &&
					!isTextarea(activeElement))
			) {
				const textareas = Array.from(
					document.getElementsByTagName('textarea'),
				).filter(isTextarea);
				const contentEditableDivs = Array.from(
					document.querySelectorAll(
						'div[contenteditable="true"], div[contenteditable=""]',
					),
				).filter(isContentEditableDiv);
				const editables = [...textareas, ...contentEditableDivs];
				if (editables.length === 1) {
					insertTextIntoEditableElement(editables[0]!, text);
					return {
						data: text,
						error: null,
					};
				}
				return {
					data: null,
					error: {
						_tag: 'WhisperingError',
						variant: 'error',
						isWarning: true,
						title: 'Please paste the transcribed text manually',
						description:
							'There are multiple text areas or content editable divs on the page.',
					},
				};
			}
			insertTextIntoEditableElement(activeElement, text);
			return { data: text, error: null } as const;
		},
		args: [transcribedText],
	});
};

const handler: PlasmoMessaging.MessageHandler<
	WriteTextToCursorMessage,
	WriteTextToCursorResult
> = async ({ body }, res) => {
	if (!body?.transcribedText) {
		res.send(
			Err(
				WhisperingError({
					title: 'Error invoking writeTextToCursor command',
					description:
						'Text must be provided in the request body of the message',
				}),
			),
		);
		return;
	}
	res.send(await writeTextToCursor(body.transcribedText));
};

export default handler;
