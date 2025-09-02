<script lang="ts">
	import { LabeledSelect } from '$lib/components/labeled/index.js';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import { IS_MACOS, IS_WINDOWS, IS_LINUX, PLATFORM_TYPE } from '$lib/constants/platform';
	import { settings } from '$lib/stores/settings.svelte';
	import { appDataDir } from '@tauri-apps/api/path';
	import { rpc } from '$lib/query';
	import { createQuery } from '@tanstack/svelte-query';
	import { interpolateTemplate, asTemplateString } from '$lib/utils/template';

	// Props - only bind the command template
	let { commandTemplate = $bindable() }: { commandTemplate: string | null } = $props();

	// Get devices for the current backend
	const isUsingBrowserBackend = $derived(
		!window.__TAURI_INTERNALS__ || settings.value['recording.backend'] === 'browser'
	);

	const getDevicesQuery = createQuery(
		() => isUsingBrowserBackend 
			? rpc.vadRecorder.enumerateDevices.options()
			: rpc.recorder.enumerateDevices.options()
	);

	// Get the actual selected device or use the first available
	const selectedDevice = $derived(
		getDevicesQuery.data?.find(d => d.id === settings.value['recording.manual.selectedDeviceId']) ??
		getDevicesQuery.data?.[0]
	);

	const FFMPEG_FORMAT_OPTIONS = [
		{ value: 'wav', label: 'WAV (Uncompressed)', codec: 'pcm_s16le' },
		{ value: 'mp3', label: 'MP3 (Compressed)', codec: 'libmp3lame' },
		{ value: 'aac', label: 'AAC (Compressed)', codec: 'aac' },
		{ value: 'ogg', label: 'OGG Vorbis', codec: 'libvorbis' },
		{ value: 'opus', label: 'Opus (Modern)', codec: 'libopus' },
	] as const;


	/**
		* UI state for the FFmpeg command builder.
		*
		* These variables (`selectedFormat`, `selectedSampleRate`, `selectedBitrate`) are temporary
		* UI state that provide a user-friendly way to construct the `commandTemplate` string
		* via dropdown selectors. The `commandTemplate` itself is the only value that is persisted.
		*
		* To ensure the UI and the template remain in sync, these values are derived by parsing
		* the `commandTemplate`. When the user changes a selection in the UI, the `commandTemplate`
		* is rebuilt from scratch using the new values.
		*/
	let selectedFormat = $derived.by(() => {
		if (commandTemplate?.includes('libmp3lame')) return 'mp3';
		if (commandTemplate?.includes('aac')) return 'aac';
		if (commandTemplate?.includes('libvorbis')) return 'ogg';
		if (commandTemplate?.includes('libopus')) return 'opus';
		return 'wav';
	});
	let selectedSampleRate = $derived(commandTemplate?.match(/-ar\s+(\d+)/)?.[1] ?? '16000');
	let selectedBitrate = $derived(commandTemplate?.match(/-b:a\s+(\d+)k?/)?.[1] ?? '128');

	// Example command with interpolated values for preview
	const exampleCommand = $derived.by(async () => {
		if (!commandTemplate) return '';
		
		// Use the template interpolation helper
		return interpolateTemplate(asTemplateString(commandTemplate), {
			device: selectedDevice?.id ?? 'default',
			outputFolder: settings.value['recording.desktop.outputFolder'] ?? (await appDataDir()),
			recordingId: 'abc123xyz',
		});
		}
	);

	// Update parent's commandTemplate whenever selections change
	$effect(() => {
		commandTemplate = buildCommandTemplateFromSelections();
	});

	function buildCommandTemplateFromSelections(): string {
		// Retrieve codec and file extension for the currently selected audio format
		const { codec, value: ext } = FFMPEG_FORMAT_OPTIONS.find(opt => opt.value === selectedFormat) ?? FFMPEG_FORMAT_OPTIONS[0];

		// Platform-specific device input format
		const deviceInput =  {
			'macos': '":{{device}}"', // macOS uses :deviceName
			'windows': '"audio={{device}}"', // Windows uses audio=deviceName
			'linux': '"{{device}}"', // Linux uses device directly
		}[PLATFORM_TYPE]
		
		const format = ({
			'macos': 'avfoundation',
			'windows': 'dshow',
			'linux': 'alsa', // Could also be pulse, but alsa is more universal
		}  as const)[PLATFORM_TYPE]
		
		let command = `ffmpeg -f ${format} -i ${deviceInput}`;
		command += ` -acodec ${codec}`;
		command += ` -ar ${selectedSampleRate}`;
		
		if (selectedFormat !== 'wav') command += ` -b:a ${selectedBitrate}k`;
		
		command += ` "{{outputFolder}}/{{recordingId}}.${ext}"`;
		
		return command;
	}
</script>

<div class="space-y-4">
	<div class="space-y-4 rounded-lg border p-4">
		<h4 class="text-sm font-medium">FFmpeg Command Builder</h4>
		
		<LabeledSelect
			id="ffmpeg-format"
			label="Audio Format"
			items={FFMPEG_FORMAT_OPTIONS}
			selected={selectedFormat}
			onSelectedChange={(selected) => {
				selectedFormat = selected;
			}}
			placeholder="Select audio format"
			description="Choose the output audio format and codec"
		/>
		
		<LabeledSelect
			id="ffmpeg-sample-rate"
			label="Sample Rate"
			items={[
				{ value: '16000', label: '16 kHz (Voice)' },
				{ value: '22050', label: '22.05 kHz (Low)' },
				{ value: '44100', label: '44.1 kHz (CD Quality)' },
				{ value: '48000', label: '48 kHz (Professional)' },
			]}
			selected={selectedSampleRate}
			onSelectedChange={(selected) => {
				selectedSampleRate = selected;
			}}
			placeholder="Select sample rate"
			description="Higher sample rates provide better quality"
		/>
		
		{#if selectedFormat !== 'wav'}
			<LabeledSelect
				id="ffmpeg-bitrate"
				label="Bitrate"
				items={[
					{ value: '64', label: '64 kbps (Low)' },
					{ value: '128', label: '128 kbps (Standard)' },
					{ value: '192', label: '192 kbps (Good)' },
					{ value: '256', label: '256 kbps (High)' },
					{ value: '320', label: '320 kbps (Best)' },
				]}
				selected={selectedBitrate}
				onSelectedChange={(selected) => {
					selectedBitrate = selected;
				}}
				placeholder="Select bitrate"
				description="Higher bitrates mean better quality but larger files"
			/>
		{/if}
		
		<!-- Command Template Section -->
		<div class="border-t pt-4 mt-4">
			<Label for="ffmpeg-command" class="text-sm font-medium mb-2 block">FFmpeg Command Template</Label>
			<Input
				id="ffmpeg-command"
				type="text"
				placeholder="FFmpeg command template"
				bind:value={commandTemplate}
				class="font-mono text-sm"
			/>
			{#await exampleCommand then cmd}
				{#if cmd}
					<div class="rounded-md bg-muted/50 p-3 mt-2">
						<p class="text-xs font-medium text-muted-foreground mb-1">Preview with example values:</p>
						<code class="text-xs break-all">{cmd}</code>
					</div>
				{/if}
			{/await}
			<div class="mt-3 text-xs text-muted-foreground space-y-1">
				<p class="font-medium">Runtime variables (will be replaced when recording starts):</p>
				<p><code class="mx-1 rounded bg-muted px-1 py-0.5">{'{{device}}'}</code> - Device name (selected in Recording Device dropdown)</p>
				<p><code class="mx-1 rounded bg-muted px-1 py-0.5">{'{{outputFolder}}'}</code> - Output directory from settings</p>
				<p><code class="mx-1 rounded bg-muted px-1 py-0.5">{'{{recordingId}}'}</code> - Unique ID for each recording</p>
				<p class="mt-2 italic">Note: Format and codec settings are injected directly into the command template.</p>
			</div>
		</div>
	</div>
</div>