<script lang="ts">
	import CopyableTextareaExpandsToDialog from '$lib/components/copyable/CopyableTextareaExpandsToDialog.svelte';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';

	let {
		recordingId,
		rows = 2,
		transcribedText,
	}: {
		recordingId: string;
		rows?: number;
		transcribedText: string;
	} = $props();

	const id = getRecordingTransitionId({
		propertyName: 'transcribedText',
		recordingId,
	});
</script>

<CopyableTextareaExpandsToDialog
	{id}
	title="Transcribed Text"
	label="transcribed text"
	text={transcribedText}
	{rows}
/>
