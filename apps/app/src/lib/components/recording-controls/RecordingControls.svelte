<script lang="ts">
	import { cn } from '$lib/utils.js';
	import TransformationSelector from '../TransformationSelector.svelte';
	import RecordingDeviceSelector from './RecordingDeviceSelector.svelte';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex items-center gap-1.5', className)}>
	<RecordingDeviceSelector />
	<TransformationSelector />
</div>
