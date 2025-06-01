import cssText from 'data-text:~/style.css';
import { recorderStateToIcons } from '@repo/shared';
import type {
	PlasmoCSConfig,
	PlasmoGetInlineAnchor,
	PlasmoGetStyle,
} from 'plasmo';
import { app } from '~lib/app';
import { useWhisperingRecorderState } from '~lib/storage';
import { waitForElement } from './utils/waitForElement';

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
	const element = await waitForElement(
		'div[aria-label="Write your prompt to Claude"]',
	);
	return {
		element,
		insertPosition: 'afterend',
	};
};

export const config: PlasmoCSConfig = {
	matches: ['https://claude.ai/*'],
	all_frames: true,
};

export const getStyle: PlasmoGetStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText.replaceAll(':root', ':host(plasmo-csui)');
	return style;
};

function RecorderStateAsIcon() {
	const recorderState = useWhisperingRecorderState();
	const recorderStateAsIcon = recorderStateToIcons[recorderState];
	return (
		<button
			className="group relative z-10 size-8 rounded-md text-xl"
			onClick={app.toggleRecording}
		>
			<div className="absolute inset-0 rounded-md bg-black bg-opacity-0 transition-opacity duration-300 group-hover:bg-opacity-10" />
			{recorderStateAsIcon}
		</button>
	);
}

export default RecorderStateAsIcon;
