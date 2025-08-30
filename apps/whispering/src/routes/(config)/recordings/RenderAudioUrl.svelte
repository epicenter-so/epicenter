<script lang="ts">
	import type { Recording } from '$lib/services/db';

	import { createBlobUrlManager } from '$lib/utils/blobUrlManager';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import { onDestroy } from 'svelte';

	let { blob, id }: Pick<Recording, 'blob' | 'id'> = $props();

	const blobUrlManager = createBlobUrlManager();

	const blobUrl = $derived.by(() => {
		if (!blob) return undefined;
		return blobUrlManager.createUrl(blob);
	});

	onDestroy(() => {
		blobUrlManager.revokeCurrentUrl();
	});
</script>

{#if blobUrl}
	<audio
		class="h-8"
		style="view-transition-name: {getRecordingTransitionId({
			propertyName: 'blob',
			recordingId: id,
		})}"
		controls
		src={blobUrl}
	>
		Your browser does not support the audio element.
	</audio>
{/if}
