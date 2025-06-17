<script lang="ts">
	import { LabeledSelect } from '$lib/components/labeled/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { settings } from '$lib/stores/settings.svelte';
	import {
		BITRATE_OPTIONS,
		MANUAL_RECORDING_METHOD_OPTIONS,
		RECORDING_MODE_OPTIONS,
	} from '@repo/shared';
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
		description="Choose how you want to activate recording: Manual control, Voice Activated Detection, or Live streaming"
	/>

	{#if settings.value['recording.mode'] === 'manual'}
		{#if window.__TAURI_INTERNALS__}
			<LabeledSelect
				id="recording-method"
				label="Recording Method"
				items={MANUAL_RECORDING_METHOD_OPTIONS}
				selected={settings.value['recording.manual.method']}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.manual.method': selected,
					};
				}}
				placeholder="Select a recording method"
				description="Choose between browser-based recording (Navigator) or native recording (Tauri)"
			/>
		{/if}

		{#if window.__TAURI_INTERNALS__ && settings.value['recording.manual.method'] === 'tauri'}
			<div class="pl-4 border-l-2 border-muted space-y-6">
				<div>
					<h4 class="text-md font-medium">Native Recording Settings</h4>
					<p class="text-muted-foreground text-sm">
						Native recording uses your system's audio APIs for better
						performance in manual mode.
					</p>
				</div>

				<SelectRecordingDevice
					selected={settings.value['recording.manual.tauri.selectedDeviceId'] ??
						''}
					onSelectedChange={(selected) => {
						settings.value = {
							...settings.value,
							'recording.manual.tauri.selectedDeviceId': selected,
						};
					}}
				></SelectRecordingDevice>
			</div>
		{:else if settings.value['recording.manual.method'] === 'navigator'}
			<div class="pl-4 border-l-2 border-muted space-y-6">
				<div>
					<h4 class="text-md font-medium">Navigator Recording Settings</h4>
					<p class="text-muted-foreground text-sm">
						Configure browser-specific recording options for manual mode.
					</p>
				</div>

				<SelectRecordingDevice
					selected={settings.value[
						`recording.manual.navigator.selectedDeviceId`
					] ?? ''}
					onSelectedChange={(selected) => {
						settings.value = {
							...settings.value,
							'recording.manual.navigator.selectedDeviceId': selected,
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
					selected={settings.value['recording.manual.navigator.bitrateKbps'] ??
						''}
					onSelectedChange={(selected) => {
						settings.value = {
							...settings.value,
							'recording.manual.navigator.bitrateKbps': selected,
						};
					}}
					placeholder="Select a bitrate"
					description="The bitrate of the recording. Higher values mean better quality but larger file sizes."
				/>
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
				selected={settings.value[`recording.vad.navigator.selectedDeviceId`] ??
					''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.vad.navigator.selectedDeviceId': selected,
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
				selected={settings.value['recording.vad.navigator.bitrateKbps'] ?? ''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.vad.navigator.bitrateKbps': selected,
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
				selected={settings.value[`recording.live.navigator.selectedDeviceId`] ??
					''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.live.navigator.selectedDeviceId': selected,
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
				selected={settings.value['recording.live.navigator.bitrateKbps'] ?? ''}
				onSelectedChange={(selected) => {
					settings.value = {
						...settings.value,
						'recording.live.navigator.bitrateKbps': selected,
					};
				}}
				placeholder="Select a bitrate"
				description="The bitrate of the recording. Higher values mean better quality but larger file sizes."
			/>
		</div>
	{/if}
</div>
