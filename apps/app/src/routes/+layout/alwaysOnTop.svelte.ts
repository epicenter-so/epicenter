import { rpc } from '$lib/query';
import { settings } from '$lib/stores/settings.svelte';
import { createQuery } from '@tanstack/svelte-query';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function syncWindowAlwaysOnTopWithRecorderState() {
	const getRecorderStateQuery = createQuery(
		rpc.recorder.getRecorderState.options,
	);

	$effect(() => {
		const setAlwaysOnTop = (value: boolean) =>
			getCurrentWindow().setAlwaysOnTop(value);
		switch (settings.value['system.alwaysOnTop']) {
			case 'Always':
				setAlwaysOnTop(true);
				break;
			case 'When Recording and Transcribing':
				if (
					getRecorderStateQuery.data === 'SESSION+RECORDING' ||
					rpc.transcription.isCurrentlyTranscribing()
				) {
					setAlwaysOnTop(true);
				} else {
					setAlwaysOnTop(false);
				}
				break;
			case 'When Recording':
				if (getRecorderStateQuery.data === 'SESSION+RECORDING') {
					setAlwaysOnTop(true);
				} else {
					setAlwaysOnTop(false);
				}
				break;
			case 'Never':
				setAlwaysOnTop(false);
				break;
		}
	});
}
