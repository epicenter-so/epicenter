<script lang="ts">
	import SelectRecordingDevice from './SelectRecordingDevice.svelte';

	import { LabeledSelect } from '$lib/components/labeled/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { getManualRecorderFromContext } from '$lib/query/singletons/manualRecorder';
	import { settings } from '$lib/stores/settings.svelte';
	import { BITRATE_OPTIONS, RECORDING_METHOD_OPTIONS } from '@repo/shared';

	const manualRecorder = getManualRecorderFromContext();
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

			<SelectRecordingDevice
				selected={settings.value[
					'recording.navigator.selectedAudioInputDeviceId'
				] ?? ''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.navigator.selectedAudioInputDeviceId': selected,
					};
				}}
			></SelectRecordingDevice>

			<LabeledSelect
				id="bit-rate"
				label="Bitrate"
				items={BITRATE_OPTIONS.map((option) => ({
					value: option.value,
					label: option.label,
				}))}
				selected={settings.value['recording.navigator.bitrateKbps']}
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

			<SelectRecordingDevice
				selected={settings.value['recording.tauri.selectedAudioInputName'] ??
					''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.tauri.selectedAudioInputName': selected,
					};
				}}
			></SelectRecordingDevice>
		</div>
	{/if}
</div>
