import { getManualRecorderFromContext } from '$lib/query/singletons/manualRecorder';
import { transcription } from '$lib/query/transcription';
import { settings } from '$lib/stores/settings.svelte';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function syncWindowAlwaysOnTopWithRecorderState() {
	const manualRecorder = getManualRecorderFromContext();

	$effect(() => {
		const setAlwaysOnTop = (value: boolean) =>
			getCurrentWindow().setAlwaysOnTop(value);
		switch (settings.value['system.alwaysOnTop']) {
			case 'Always':
				void setAlwaysOnTop(true);
				break;
			case 'When Recording and Transcribing':
				if (
					manualRecorder.recorderState === 'SESSION+RECORDING' ||
					transcription.isCurrentlyTranscribing()
				) {
					void setAlwaysOnTop(true);
				} else {
					void setAlwaysOnTop(false);
				}
				break;
			case 'When Recording':
				if (manualRecorder.recorderState === 'SESSION+RECORDING') {
					void setAlwaysOnTop(true);
				} else {
					void setAlwaysOnTop(false);
				}
				break;
			case 'Never':
				void setAlwaysOnTop(false);
				break;
		}
	});
}
