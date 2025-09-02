<script lang="ts">
	import DesktopOutputFolder from './DesktopOutputFolder.svelte';
	import FfmpegCommandBuilder from './FfmpegCommandBuilder.svelte';
	import { LabeledSelect } from '$lib/components/labeled/index.js';
	import { Separator } from '@repo/ui/separator';
	import * as Alert from '@repo/ui/alert';
	import { Link } from '@repo/ui/link';
	import { InfoIcon } from '@lucide/svelte';
	import {
		BITRATE_OPTIONS,
		RECORDING_MODE_OPTIONS,
	} from '$lib/constants/audio';
	import { settings } from '$lib/stores/settings.svelte';
	import SelectRecordingDevice from './SelectRecordingDevice.svelte';
	import {
		isUsingNativeBackendWithCloudTranscription,
		isUsingNativeBackendAtWrongSampleRate,
	} from '../../../+layout/check-ffmpeg';
	import { IS_MACOS } from '$lib/constants/platform';

	const { data } = $props();

	const SAMPLE_RATE_OPTIONS = [
		{ value: '16000', label: 'Voice Quality (16kHz): Optimized for speech' },
		{ value: '44100', label: 'Standard Quality (44.1kHz): CD quality' },
		{ value: '48000', label: 'High Quality (48kHz): Professional audio' },
	] as const;

	const RECORDING_BACKEND_OPTIONS = [
		{ value: 'native', label: 'Native (Rust)' },
		{ value: 'browser', label: 'Browser (MediaRecorder)' },
		{ value: 'ffmpeg', label: 'FFmpeg (Command-line)' },
	] as const;

	const isUsingBrowserBackend = $derived(
		!window.__TAURI_INTERNALS__ || settings.value['recording.backend'] === 'browser',
	);
	
	const isUsingFfmpegBackend = $derived(
		settings.value['recording.backend'] === 'ffmpeg',
	);
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
			settings.updateKey('recording.mode', selected);
		}}
		placeholder="Select a recording mode"
		description={`Choose how you want to activate recording: ${RECORDING_MODE_OPTIONS.map(
			(option) => option.label.toLowerCase(),
		).join(', ')}`}
	/>

	{#if window.__TAURI_INTERNALS__ && settings.value['recording.mode'] === 'manual'}
		<LabeledSelect
			id="recording-backend"
			label="Recording Backend"
			items={RECORDING_BACKEND_OPTIONS}
			selected={settings.value['recording.backend']}
			onSelectedChange={(selected) => {
				settings.updateKey('recording.backend', selected);
			}}
			placeholder="Select a recording backend"
			description={{
				'native':  'Native: Uses Rust audio backend for lower-level access and potentially better quality',
				'browser': 'Browser: Uses web standards (MediaRecorder API) for better compatibility',
				'ffmpeg': 'FFmpeg: Uses FFmpeg command-line tool for maximum flexibility and format support',
				}[settings.value['recording.backend']]
			}
		/>

		{#if settings.value['recording.backend'] === 'ffmpeg' && !data.ffmpegInstalled}
			<Alert.Root class="border-red-500/20 bg-red-500/5">
				<InfoIcon class="size-4 text-red-600 dark:text-red-400" />
				<Alert.Title class="text-red-600 dark:text-red-400">
					FFmpeg Not Installed
				</Alert.Title>
				<Alert.Description>
					FFmpeg is required for the FFmpeg recording backend. Please install it to use this feature.
					<Link
						href="/install-ffmpeg"
						class="font-medium underline underline-offset-4 hover:text-red-700 dark:hover:text-red-300"
					>
						Install FFmpeg →
					</Link>
				</Alert.Description>
			</Alert.Root>
		{:else if IS_MACOS && settings.value['recording.backend'] === 'browser'}
			<Alert.Root class="border-amber-500/20 bg-amber-500/5">
				<InfoIcon class="size-4 text-amber-600 dark:text-amber-400" />
				<Alert.Title class="text-amber-600 dark:text-amber-400">
					Global Shortcuts May Be Unreliable
				</Alert.Title>
				<Alert.Description>
					When using the browser recorder, macOS App Nap may prevent the browser
					recording logic from starting when not in focus. Consider using the
					native backend for reliable global shortcut support.
				</Alert.Description>
			</Alert.Root>
		{/if}

		{#if isUsingNativeBackendAtWrongSampleRate() && !data.ffmpegInstalled}
			<Alert.Root class="border-amber-500/20 bg-amber-500/5">
				<InfoIcon class="size-4 text-amber-600 dark:text-amber-400" />
				<Alert.Title class="text-amber-600 dark:text-amber-400">
					FFmpeg Required
				</Alert.Title>
				<Alert.Description>
					Whisper C++ requires 16kHz audio. FFmpeg is needed to convert from
					your current {settings.value['recording.desktop.sampleRate']}Hz sample
					rate.
					<Link
						href="/install-ffmpeg"
						class="font-medium underline underline-offset-4 hover:text-amber-700 dark:hover:text-amber-300"
					>
						Install FFmpeg →
					</Link>
				</Alert.Description>
			</Alert.Root>
		{:else if isUsingNativeBackendWithCloudTranscription() && !data.ffmpegInstalled}
			<Alert.Root class="border-amber-500/20 bg-amber-500/5">
				<InfoIcon class="size-4 text-amber-600 dark:text-amber-400" />
				<Alert.Title class="text-amber-600 dark:text-amber-400">
					FFmpeg Recommended
				</Alert.Title>
				<Alert.Description>
					We highly recommend installing FFmpeg for optimal audio processing
					with the Native recording backend. FFmpeg enables audio compression
					for faster uploads to transcription services.
					<Link
						href="/install-ffmpeg"
						class="font-medium underline underline-offset-4 hover:text-amber-700 dark:hover:text-amber-300"
					>
						Install FFmpeg →
					</Link>
				</Alert.Description>
			</Alert.Root>
		{/if}
	{/if}

	{#if settings.value['recording.mode'] === 'manual'}
		<SelectRecordingDevice
			selected={settings.value['recording.manual.selectedDeviceId']}
			onSelectedChange={(selected) => {
				settings.updateKey('recording.manual.selectedDeviceId', selected);
			}}
			mode="manual"
		></SelectRecordingDevice>
	{:else if settings.value['recording.mode'] === 'vad'}
		<SelectRecordingDevice
			selected={settings.value['recording.vad.selectedDeviceId']}
			onSelectedChange={(selected) => {
				settings.updateKey('recording.vad.selectedDeviceId', selected);
			}}
			mode="vad"
		></SelectRecordingDevice>
	{/if}

	{#if settings.value['recording.mode'] === 'manual' || settings.value['recording.mode'] === 'vad'}
		{#if isUsingBrowserBackend}
			<!-- Browser backend settings -->
			<LabeledSelect
				id="bit-rate"
				label="Bitrate"
				items={BITRATE_OPTIONS.map((option) => ({
					value: option.value,
					label: option.label,
				}))}
				selected={settings.value['recording.navigator.bitrateKbps']}
				onSelectedChange={(selected) => {
					settings.updateKey('recording.navigator.bitrateKbps', selected);
				}}
				placeholder="Select a bitrate"
				description="The bitrate of the recording. Higher values mean better quality but larger file sizes."
			/>
		{:else if isUsingFfmpegBackend}
			<!-- FFmpeg backend settings -->
			<div class="space-y-2">
				<label for="output-folder" class="text-sm font-medium">
					Recording Output Folder
				</label>
				<DesktopOutputFolder></DesktopOutputFolder>
				<p class="text-xs text-muted-foreground">
					Choose where to save your recordings. Default location is secure and
					managed by the app.
				</p>
			</div>
			
			<FfmpegCommandBuilder bind:commandTemplate={settings.value['recording.ffmpeg.commandTemplate']} />
		{:else}
			<!-- Native backend settings -->
			<LabeledSelect
				id="sample-rate"
				label="Sample Rate"
				items={SAMPLE_RATE_OPTIONS}
				selected={settings.value['recording.desktop.sampleRate']}
				onSelectedChange={(selected) => {
					settings.updateKey(
						'recording.desktop.sampleRate',
						selected as (typeof SAMPLE_RATE_OPTIONS)[number]['value'],
					);
				}}
				placeholder="Select sample rate"
				description="Higher sample rates provide better quality but create larger files"
			/>

			<div class="space-y-2">
				<label for="output-folder" class="text-sm font-medium">
					Recording Output Folder
				</label>
				<DesktopOutputFolder></DesktopOutputFolder>
				<p class="text-xs text-muted-foreground">
					Choose where to save your recordings. Default location is secure and
					managed by the app.
				</p>
			</div>
		{/if}
	{/if}
</div>
