<script lang="ts">
	import CopyableTextareaExpandsToDialog from '$lib/components/copyable/CopyableTextareaExpandsToDialog.svelte';
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

<CopyableTextareaExpandsToDialog
	{id}
	title="Transcribed Text"
	label="transcribed text"
	text={transcribedText}
	{rows}
/>
