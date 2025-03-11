<script lang="ts">
	import { LabeledSelect } from '$lib/components/labeled/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { useGetMediaDevices } from '$lib/query/audio/queries';
	import { getManualRecorderFromContext } from '$lib/query/singletons/manualRecorder';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { BITRATE_OPTIONS, RECORDING_METHOD_OPTIONS } from '@repo/shared';
	import type { SettingsV5 } from '@repo/shared/settings';

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

	<LabeledSelect
		id="recording-method"
		label="Recording Method"
		items={RECORDING_METHOD_OPTIONS}
		selected={settings.value['recording.method']}
		onSelectedChange={(selected) => {
			manualRecorder.closeRecordingSessionSilent();
			settings.value = {
				...settings.value,
				'recording.method': selected,
			};
		}}
		placeholder="Select a recording method"
		description="Choose between browser-based recording (Navigator) or native recording (Tauri)"
	/>

	{#if settings.value['recording.method'] === 'navigator'}
		<div class="pl-4 border-l-2 border-muted space-y-6">
			<div>
				<h4 class="text-md font-medium">Browser API Settings</h4>
				<p class="text-muted-foreground text-sm">
					Configure browser-specific recording options.
				</p>
			</div>

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
					selected={(settings.value as Partial<SettingsV5>)[
						'recording.navigator.selectedAudioInputDeviceId'
					] ?? ''}
					onSelectedChange={(selected) => {
						manualRecorder.closeRecordingSessionSilent();
						settings.value = {
							...settings.value,
							'recording.navigator.selectedAudioInputDeviceId': selected,
						} as typeof settings.value;
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
				selected={(settings.value as Partial<SettingsV5>)[
					'recording.navigator.bitrateKbps'
				]}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.navigator.bitrateKbps': selected,
					} as typeof settings.value;
				}}
				placeholder="Select a bitrate"
				description="16kbps is recommended since the Whisper model internally processes at 16kHz. Higher bitrates won't improve transcription quality."
			/>
		</div>
	{:else}
		<div class="pl-4 border-l-2 border-muted space-y-6">
			<div>
				<h4 class="text-md font-medium">Native Recording Settings</h4>
				<p class="text-muted-foreground text-sm">
					Native recording uses your system's audio APIs for better performance.
				</p>
			</div>
			<p class="text-sm text-muted-foreground">
				Native recording settings are managed by the system. No additional
				configuration is needed.
			</p>
		</div>
	{/if}
</div>
