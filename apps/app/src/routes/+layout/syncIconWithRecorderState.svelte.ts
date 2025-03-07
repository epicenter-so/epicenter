import { getManualRecorderFromContext } from '$lib/query/singletons/manualRecorder';
import { SetTrayIconService } from '$lib/services';

export function syncIconWithRecorderState() {
	const manualRecorder = getManualRecorderFromContext();

	$effect(() => {
		SetTrayIconService.setTrayIcon(manualRecorder.recorderState);
	});
}
