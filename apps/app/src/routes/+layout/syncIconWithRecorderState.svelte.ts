import { getRecorderFromContext } from '$lib/query/singletons/recorder';
import { SetTrayIconService } from '$lib/services';

export function syncIconWithRecorderState() {
	const recorder = getRecorderFromContext();

	$effect(() => {
		SetTrayIconService.setTrayIcon(recorder.recorderState);
	});
}
