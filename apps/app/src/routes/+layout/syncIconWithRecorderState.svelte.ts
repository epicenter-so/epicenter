import { recorder } from '$lib/query/recorder';
import { SetTrayIconService } from '$lib/services';
import { createQuery } from '@tanstack/svelte-query';

export function syncIconWithRecorderState() {
	const getRecorderStateQuery = createQuery(recorder.getRecorderState.options);

	$effect(() => {
		if (getRecorderStateQuery.data) {
			SetTrayIconService.setTrayIcon(getRecorderStateQuery.data);
		}
	});
}
