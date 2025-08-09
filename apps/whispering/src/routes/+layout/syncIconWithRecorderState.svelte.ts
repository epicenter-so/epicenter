import { rpc } from '$lib/query';
import { createQuery } from '@tanstack/svelte-query';

export function syncIconWithRecorderState() {
	const getRecorderStateQuery = createQuery(
		rpc.recorder.getRecorderState.options,
	);

	$effect(() => {
		if (getRecorderStateQuery.data) {
			rpc.tray.setTrayIcon.execute({
				icon: getRecorderStateQuery.data,
			});
		}
	});
}
