<script lang="ts">
	import { LabeledSelect } from '$lib/components/labeled/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { settings } from '$lib/stores/settings.svelte';
	import { BITRATE_OPTIONS, RECORDING_MODE_OPTIONS } from '$lib/constants';
	import SelectRecordingDevice from './SelectRecordingDevice.svelte';
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
		id="recording-mode"
		label="Recording Mode"
		items={RECORDING_MODE_OPTIONS}
		selected={settings.value['recording.mode']}
		onSelectedChange={(selected) => {
			settings.value = {
				...settings.value,
				'recording.mode': selected,
			};
		}}
		placeholder="Select a recording mode"
		description="Choose how you want to activate recording: Manual control, CPAL (native), Voice Activated Detection, or Live streaming"
	/>

	{#if settings.value['recording.mode'] === 'manual'}
		<div class="pl-4 border-l-2 border-muted space-y-6">
			<div>
				<h4 class="text-md font-medium">Manual Recording Settings</h4>
				<p class="text-muted-foreground text-sm">
					Configure browser-based recording options for manual mode.
				</p>
			</div>

			<SelectRecordingDevice
				selected={settings.value['recording.manual.selectedDeviceId'] ?? ''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.manual.selectedDeviceId': selected,
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
				selected={settings.value['recording.manual.bitrateKbps'] ?? ''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.manual.bitrateKbps': selected,
					};
				}}
				placeholder="Select a bitrate"
				description="The bitrate of the recording. Higher values mean better quality but larger file sizes."
			/>
		</div>
	{:else if settings.value['recording.mode'] === 'cpal'}
		{#if window.__TAURI_INTERNALS__}
			<div class="pl-4 border-l-2 border-muted space-y-6">
				<div>
					<h4 class="text-md font-medium">CPAL Recording Settings</h4>
					<p class="text-muted-foreground text-sm">
						Native CPAL recording uses your system's audio APIs for better
						performance.
					</p>
				</div>

				<SelectRecordingDevice
					selected={settings.value['recording.cpal.selectedDeviceId'] ?? ''}
					onSelectedChange={(selected) => {
						settings.value = {
							...settings.value,
							'recording.cpal.selectedDeviceId': selected,
						};
					}}
				></SelectRecordingDevice>
			</div>
		{:else}
			<div class="pl-4 border-l-2 border-muted space-y-6">
				<div>
					<h4 class="text-md font-medium">CPAL Recording Not Available</h4>
					<p class="text-muted-foreground text-sm">
						CPAL recording is only available in the desktop app.
					</p>
				</div>
			</div>
		{/if}
	{:else if settings.value['recording.mode'] === 'vad'}
		<div class="pl-4 border-l-2 border-muted space-y-6">
			<div>
				<h4 class="text-md font-medium">Voice Activated Recording Settings</h4>
				<p class="text-muted-foreground text-sm">
					Configure voice activated recording options for vad mode.
				</p>
			</div>

			<SelectRecordingDevice
				selected={settings.value['recording.vad.selectedDeviceId'] ?? ''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.vad.selectedDeviceId': selected,
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
				selected={settings.value['recording.vad.bitrateKbps'] ?? ''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.vad.bitrateKbps': selected,
					};
				}}
				placeholder="Select a bitrate"
				description="The bitrate of the recording. Higher values mean better quality but larger file sizes."
			/>
		</div>
	{:else if settings.value['recording.mode'] === 'live'}
		<div class="pl-4 border-l-2 border-muted space-y-6">
			<div>
				<h4 class="text-md font-medium">Live Recording Settings</h4>
				<p class="text-muted-foreground text-sm">
					Configure live recording options for live mode.
				</p>
			</div>

			<SelectRecordingDevice
				selected={settings.value['recording.live.selectedDeviceId'] ?? ''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.live.selectedDeviceId': selected,
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
				selected={settings.value['recording.live.bitrateKbps'] ?? ''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.live.bitrateKbps': selected,
					};
				}}
				placeholder="Select a bitrate"
				description="The bitrate of the recording. Higher values mean better quality but larger file sizes."
			/>
		</div>
	{/if}
</div>
