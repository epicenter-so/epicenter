<script lang="ts">
	import { LabeledSelect } from '$lib/components/labeled/index.js';
	import { rpc } from '$lib/query';
	import type { DeviceEnumerationStrategy } from '$lib/query/_queries/device';
	import { toast } from '$lib/toast';
	import { createQuery } from '@tanstack/svelte-query';

	let {
		deviceEnumerationStrategy,
		selected,
		onSelectedChange,
	}: {
		deviceEnumerationStrategy: DeviceEnumerationStrategy;
		selected: string;
		onSelectedChange: (selected: string) => void;
	} = $props();

	const getDevicesQuery = createQuery(
		rpc.device.getDevices(deviceEnumerationStrategy).options,
	);

	$effect(() => {
		if (getDevicesQuery.isError) {
			toast.warning({
				title: 'Error loading devices',
				description: getDevicesQuery.error.message,
			});
		}
	});
</script>

{#if getDevicesQuery.isPending}
	<LabeledSelect
		id="recording-device"
		label="Recording Device"
		placeholder="Loading devices..."
		items={[]}
		selected=""
		onSelectedChange={() => {}}
		disabled
	/>
{:else if getDevicesQuery.isError}
	<p class="text-sm text-red-500">
		{getDevicesQuery.error.message}
	</p>
{:else}
	{@const items = getDevicesQuery.data.map((device) => ({
		value: device.deviceId,
		label: device.label,
	}))}
	<LabeledSelect
		id="recording-device"
		label="Recording Device"
		{items}
		{selected}
		{onSelectedChange}
		placeholder="Select a device"
	/>
{/if}
