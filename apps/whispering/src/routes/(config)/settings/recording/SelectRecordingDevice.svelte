<script lang="ts">
	import type { DeviceIdentifier } from '$lib/services/types';

	import { LabeledSelect } from '$lib/components/labeled/index.js';
	import { rpc } from '$lib/query';
	import { asDeviceIdentifier } from '$lib/services/types';
	import { settings } from '$lib/stores/settings.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	
	let {
		mode,
		onSelectedChange,
		selected 
	}: {
		mode: 'manual' | 'vad';
		onSelectedChange: (selected: DeviceIdentifier | null) => void;
		selected: DeviceIdentifier | null;
	} = $props();

	// Determine which backend to use for device enumeration
	// VAD always uses browser, manual uses the configured backend
	const isUsingBrowserBackend = $derived(
		mode === 'vad' || 
		!window.__TAURI_INTERNALS__ ||
		settings.value['recording.backend'] === 'browser' 
	);

	const getDevicesQuery = createQuery(
		() => isUsingBrowserBackend 
			? rpc.vadRecorder.enumerateDevices.options()
			: rpc.recorder.enumerateDevices.options()
	);

	$effect(() => {
		if (getDevicesQuery.isError) {
			rpc.notify.warning.execute(
				getDevicesQuery.error
			);
		}
	});
</script>

{#if getDevicesQuery.isPending}
	<LabeledSelect
		id="recording-device"
		label="Recording Device"
		placeholder="Loading devices..."
		items={[{ label: 'Loading devices...', value: '' }]}
		selected=""
		onSelectedChange={() => {}}
		disabled
	/>
{:else if getDevicesQuery.isError}
	<p class="text-sm text-red-500">
		{getDevicesQuery.error.title}
	</p>
{:else}
	{@const items = getDevicesQuery.data.map((device) => ({
		label: device.label,
		value: device.id,
	}))}
	<LabeledSelect
		id="recording-device"
		label="Recording Device"
		{items}
		selected={selected ?? asDeviceIdentifier('')}
		onSelectedChange={(value) => onSelectedChange(value ? asDeviceIdentifier(value) : null)}
		placeholder="Select a device"
	/>
{/if}
