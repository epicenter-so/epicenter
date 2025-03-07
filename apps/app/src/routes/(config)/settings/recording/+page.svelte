<script lang="ts">
	import { LabeledSelect } from '$lib/components/labeled/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { useGetMediaDevices } from '$lib/query/audio/queries';
	import { getManualRecorderFromContext } from '$lib/query/singletons/manualRecorder';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { BITRATE_OPTIONS } from '@repo/shared';

	const manualRecorder = getManualRecorderFromContext();
	const { getMediaDevicesQuery } = useGetMediaDevices();

	$effect(() => {
		if (getMediaDevicesQuery.isError) {
			toast.warning(getMediaDevicesQuery.error);
		}
	});
</script>

<svelte:head>
	<title>Recording Settings - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Recording</h3>
		<p class="text-muted-foreground text-sm">
			Configure your Whispering recording preferences.
		</p>
	</div>
	<Separator />

	{#if getMediaDevicesQuery.isPending}
		<LabeledSelect
			id="recording-device"
			label="Recording Device"
			placeholder="Loading devices..."
			items={[]}
			selected={''}
			onSelectedChange={() => {}}
			disabled
		/>
	{:else if getMediaDevicesQuery.isError}
		<p class="text-sm text-red-500">
			{getMediaDevicesQuery.error.title}: {getMediaDevicesQuery.error
				.description}
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
			selected={settings.value['recording.selectedAudioInputDeviceId'] ?? ''}
			onSelectedChange={(selected) => {
				manualRecorder.closeRecordingSessionSilent();
				settings.value = {
					...settings.value,
					'recording.selectedAudioInputDeviceId': selected,
				};
			}}
			placeholder="Select a device"
		/>
	{/if}

	<LabeledSelect
		id="bit-rate"
		label="Bitrate"
		items={BITRATE_OPTIONS.map((option) => ({
			value: option.value,
			label: option.label,
		}))}
		selected={settings.value['recording.bitrateKbps']}
		onSelectedChange={(selected) => {
			settings.value = {
				...settings.value,
				'recording.bitrateKbps': selected,
			};
		}}
		placeholder="Select a bitrate"
		description="16kbps is recommended since the Whisper model internally processes at 16kHz. Higher bitrates won't improve transcription quality."
	/>
</div>
