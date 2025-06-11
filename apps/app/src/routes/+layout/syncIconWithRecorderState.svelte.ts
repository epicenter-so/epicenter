import { recorder } from '$lib/query/recorder';
import { services } from '$lib/services';
import { createQuery } from '@tanstack/svelte-query';

export function syncIconWithRecorderState() {
	const getRecorderStateQuery = createQuery(recorder.getRecorderState.options);

	$effect(() => {
		if (getRecorderStateQuery.data) {
			services.setTrayIcon.setTrayIcon(getRecorderStateQuery.data);
		}
	});
}
