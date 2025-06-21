import { rpc } from '$lib/query';
import * as services from '$lib/services';
import { createQuery } from '@tanstack/svelte-query';

export function syncIconWithRecorderState() {
	const getRecorderStateQuery = createQuery(
		rpc.manualRecorder.getRecorderState.options,
	);

	$effect(() => {
		if (getRecorderStateQuery.data) {
			services.setTrayIcon.setTrayIcon(getRecorderStateQuery.data);
		}
	});
}
