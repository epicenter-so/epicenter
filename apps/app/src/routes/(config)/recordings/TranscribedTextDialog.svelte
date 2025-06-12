<script lang="ts">
	import CopyableTextDialog from '$lib/components/copyable/CopyableTextDialog.svelte';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';

	let {
		recordingId,
		transcribedText,
		rows = 2,
	}: {
		recordingId: string;
		transcribedText: string;
		rows?: number;
	} = $props();

	const id = getRecordingTransitionId({
		recordingId,
		propertyName: 'transcribedText',
	});
</script>

<CopyableTextDialog
	{id}
	label="Transcribed Text"
	text={transcribedText}
	{rows}
/>
