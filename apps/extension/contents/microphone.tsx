import { sendToBackground } from '@plasmohq/messaging';
import { useStorage } from '@plasmohq/storage/hook';
import { WhisperingError, recorderStateToIcons, type RecorderState } from '@repo/shared';
import cssText from 'data-text:~/style.css';
import { Effect } from 'effect';
import type {
	PlasmoCSConfig,
	PlasmoGetInlineAnchorList,
	PlasmoGetStyle,
	PlasmoMountShadowHost,
} from 'plasmo';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceContentLive } from '~lib/services/NotificationServiceContentLive';
import { STORAGE_KEYS } from '~lib/services/extension-storage';
import type * as ToggleRecording from '../background/messages/contents/toggleRecording';

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
	const allEditableElements = document.querySelectorAll(
		[
			// "input[type='text']",
			// "input[type='search']",
			// "input[type='email']",
			// "input[type='url']",
			// "input[type='tel']",
			// "input[type='password']",
			// "input[type='number']",
			// 'input:not([type])',
			'textarea',
			'[contenteditable="true"]',
			'[contenteditable=""]',
		].join(', '),
	) as NodeListOf<HTMLElement>;

	const editableElements = Array.from(allEditableElements).filter((element) => {
		const style = window.getComputedStyle(element);
		return (
			style.display !== 'none' &&
			style.visibility !== 'hidden' &&
			!element.disabled &&
			!element.readOnly &&
			element.offsetParent !== null &&
			element.getAttribute('aria-readonly') !== 'true' &&
			element.getAttribute('aria-disabled') !== 'true'
		);
	});

	return editableElements.map((element) => ({
		element,
		insertPosition: 'afterend',
	}));
};

export const mountShadowHost: PlasmoMountShadowHost = ({ shadowHost, anchor, mountState }) => {
	if (!anchor?.element) return;
	const editableElement = anchor.element as HTMLElement;

	const wrapper = document.createElement('div');
	wrapper.style.display = 'flex';
	wrapper.style.alignItems = 'center';

	wrapper.style.width = '100%';
	editableElement.style.width = '100%';

	editableElement.parentNode?.insertBefore(wrapper, editableElement);
	wrapper.appendChild(editableElement);
	wrapper.appendChild(shadowHost);

	// mountState?.observer?.disconnect(); // OPTIONAL DEMO: stop the observer as needed
};

export const config: PlasmoCSConfig = {
	matches: ['https://www.chatgpt.com/*', 'https://claude.ai/*'],
	all_frames: true,
};

export const getStyle: PlasmoGetStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText.replaceAll(':root', ':host(plasmo-csui)');
	return style;
};

const toggleRecordingFromContentScript = () =>
	Effect.tryPromise({
		try: () =>
			sendToBackground<ToggleRecording.RequestBody, ToggleRecording.ResponseBody>({
				name: 'contents/toggleRecording',
			}),
		catch: (error) =>
			new WhisperingError({
				title: `Unable to toggle recording via background service worker`,
				description:
					error instanceof Error
						? error.message
						: 'There was likely an issue sending the message to the background service worker from the contentscript.',
				error,
			}),
	}).pipe(
		Effect.catchAll(renderErrorAsNotification),
		Effect.provide(NotificationServiceContentLive),
		Effect.runPromise,
	);

function RecorderStateAsIcon() {
	const [recorderState] = useStorage<RecorderState>(STORAGE_KEYS.RECORDER_STATE, 'IDLE');
	const recorderStateAsIcon = recorderStateToIcons[recorderState];
	return (
		<button
			className="group relative z-10 h-10 w-10 rounded-md"
			onClick={toggleRecordingFromContentScript}
		>
			<div className="absolute inset-0 rounded-md bg-black bg-opacity-0 transition-opacity duration-300 group-hover:bg-opacity-10"></div>
			{recorderStateAsIcon}
		</button>
	);
}

export default RecorderStateAsIcon;
