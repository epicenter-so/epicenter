<script lang="ts">
	import { LabeledSelect } from '$lib/components/labeled/index.js';
	import { recorder } from '$lib/query/recorder';
	import { getManualRecorderFromContext } from '$lib/query/singletons/manualRecorder';
	import { toast } from '$lib/services/toast';
	import { createResultQuery } from '@tanstack/svelte-query';

	let {
		selected,
		onSelectedChange,
	}: {
		selected: string;
		onSelectedChange: (selected: string) => void;
	} = $props();

	const manualRecorder = getManualRecorderFromContext();
	const getMediaDevicesQuery = createResultQuery(() =>
		recorder.getMediaDevices(),
	);

	$effect(() => {
		if (getMediaDevicesQuery.isError) {
			toast.warning({
				title: 'Error loading devices',
				description: getMediaDevicesQuery.error.message,
			});
		}
	});
</script>

{#if getMediaDevicesQuery.isPending}
	<LabeledSelect
		id="recording-device"
		label="Recording Device"
		placeholder="Loading devices..."
		items={[]}
		selected=""
		onSelectedChange={() => {}}
		disabled
	/>
{:else if getMediaDevicesQuery.isError}
	<p class="text-sm text-red-500">
		{getMediaDevicesQuery.error.message}
	</p>
{:else}
	{@const items = getMediaDevicesQuery.data.map((device) => ({
		value: device.deviceId,
		label: device.label,
	}))}
	<LabeledSelect
		id="recording-device"
		label="Recording Device"
		{items}
		{selected}
		onSelectedChange={(selected) => {
			manualRecorder.closeRecordingSessionSilent();
			onSelectedChange(selected);
		}}
		placeholder="Select a device"
	/>
{/if}
