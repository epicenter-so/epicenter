import { recorder } from '$lib/query/recorder';
import { transcription } from '$lib/query/transcription';
import { settings } from '$lib/stores/settings.svelte';
import { createResultQuery } from '@tanstack/svelte-query';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function syncWindowAlwaysOnTopWithRecorderState() {
	const getRecorderStateQuery = createResultQuery(recorder.getRecorderState);

	$effect(() => {
		const setAlwaysOnTop = (value: boolean) =>
			getCurrentWindow().setAlwaysOnTop(value);
		switch (settings.value['system.alwaysOnTop']) {
			case 'Always':
				void setAlwaysOnTop(true);
				break;
			case 'When Recording and Transcribing':
				if (
					getRecorderStateQuery.data === 'SESSION+RECORDING' ||
					transcription.isCurrentlyTranscribing()
				) {
					void setAlwaysOnTop(true);
				} else {
					void setAlwaysOnTop(false);
				}
				break;
			case 'When Recording':
				if (getRecorderStateQuery.data === 'SESSION+RECORDING') {
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
