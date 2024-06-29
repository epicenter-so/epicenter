import { sendToBackground } from '@plasmohq/messaging';
import { useStorage } from '@plasmohq/storage/hook';
import { WhisperingError, recorderStateToIcons, type RecorderState } from '@repo/shared';
import cssText from 'data-text:~/style.css';
import { Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle } from 'plasmo';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceContentLive } from '~lib/services/NotificationServiceContentLive';
import { STORAGE_KEYS } from '~lib/services/extension-storage';
import type * as ToggleRecording from '../background/messages/contents/toggleRecording';

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
	const element = document.querySelector('#prompt-textarea')?.closest('div');
	return {
		element,
		insertPosition: 'afterend',
	};
};

export const config: PlasmoCSConfig = {
	matches: ['https://chatgpt.com/*'],
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
			className="group relative z-10 h-10 w-10 rounded-md text-2xl"
			onClick={toggleRecordingFromContentScript}
		>
			<div className="absolute inset-0 rounded-md bg-black bg-opacity-0 transition-opacity duration-300 group-hover:bg-opacity-10"></div>
			{recorderStateAsIcon}
		</button>
	);
}

export default RecorderStateAsIcon;
