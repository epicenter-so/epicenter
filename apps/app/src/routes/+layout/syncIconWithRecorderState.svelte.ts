import { recorder } from '$lib/query/recorder';
import { SetTrayIconService } from '$lib/services';
import { createResultQuery } from '@tanstack/svelte-query';

export function syncIconWithRecorderState() {
	const getRecorderStateQuery = createResultQuery(
		() => recorder.getRecorderState,
	);

	$effect(() => {
		if (getRecorderStateQuery.data) {
			SetTrayIconService.setTrayIcon(getRecorderStateQuery.data);
		}
	});
}
