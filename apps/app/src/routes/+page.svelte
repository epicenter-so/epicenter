<script lang="ts">
	import { commandCallbacks } from '$lib/commands';
	import NavItems from '$lib/components/NavItems.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import CopyToClipboardButton from '$lib/components/copyable/CopyToClipboardButton.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import {
		DeviceSelector,
		TranscriptionSelector,
		TransformationSelector,
	} from '$lib/components/settings';
	import * as ToggleGroup from '@repo/ui/toggle-group';
	import {
		RECORDING_MODE_OPTIONS,
		type RecordingMode,
		cpalStateToIcons,
		recorderStateToIcons,
		vadStateToIcons,
	} from '$lib/constants/audio';
	import { rpc } from '$lib/query';
	import type { Recording } from '$lib/services/db';
	import { settings } from '$lib/stores/settings.svelte';
	import { createBlobUrlManager } from '$lib/utils/blobUrlManager';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import { createQuery } from '@tanstack/svelte-query';
	import { Loader2Icon } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import TranscribedTextDialog from './(config)/recordings/TranscribedTextDialog.svelte';

	const getRecorderStateQuery = createQuery(
		rpc.manualRecorder.getRecorderState.options,
	);
	const getCpalStateQuery = createQuery(
		rpc.cpalRecorder.getRecorderState.options,
	);
	const getVadStateQuery = createQuery(rpc.vadRecorder.getVadState.options);
	const latestRecordingQuery = createQuery(
		rpc.recordings.getLatestRecording.options,
	);

	const latestRecording = $derived<Recording>(
		latestRecordingQuery.data ?? {
			id: '',
			title: '',
			subtitle: '',
			createdAt: '',
			updatedAt: '',
			timestamp: '',
			blob: new Blob(),
			transcribedText: '',
			transcriptionStatus: 'UNPROCESSED',
		},
	);

	const blobUrlManager = createBlobUrlManager();

	const blobUrl = $derived.by(() => {
		if (!latestRecording.blob) return undefined;
		return blobUrlManager.createUrl(latestRecording.blob);
	});

	const availableModes = $derived(
		RECORDING_MODE_OPTIONS.filter((mode) => {
			if (!mode.desktopOnly) return true;
			// Desktop only, only show if Tauri is available
			return window.__TAURI_INTERNALS__;
		}),
	);

	onDestroy(() => {
		blobUrlManager.revokeCurrentUrl();
	});

	let fileInput: HTMLInputElement | undefined = $state();

</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<main class="flex flex-1 flex-col items-center justify-center gap-4">
	<div class="xs:flex hidden flex-col items-center gap-4">
		<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
			Whispering
		</h1>
		<p class="text-muted-foreground text-center">
			Press shortcut → speak → get text. Free and open source ❤️
		</p>
	</div>

	<ToggleGroup.Root
		type="single"
		value={settings.value['recording.mode']}
		class="max-w-sm sm:max-w-md lg:max-w-lg w-full"
		onValueChange={async (mode) => {
			if (!mode) return;
			await rpc.settings.switchRecordingMode.execute(mode as RecordingMode);
		}}
	>
		{#each availableModes as option}
			<ToggleGroup.Item
				value={option.value}
				aria-label={`Switch to ${option.label.toLowerCase()} mode`}
			>
				{option.icon}
				{option.label}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>

	<div
		class="max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-2xl flex items-end justify-between w-full gap-2 pt-1"
	>
		<div class="flex-1"></div>
		{#if settings.value['recording.mode'] === 'manual'}
			<WhisperingButton
				tooltipContent={getRecorderStateQuery.data === 'IDLE'
					? 'Start recording'
					: 'Stop recording'}
				onclick={commandCallbacks.toggleManualRecording}
				variant="ghost"
				class="shrink-0 size-32 sm:size-36 lg:size-40 xl:size-44 transform items-center justify-center overflow-hidden duration-300 ease-in-out"
			>
				<span
					style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5)); view-transition-name: microphone-icon;"
					class="text-[100px] sm:text-[110px] lg:text-[120px] xl:text-[130px] leading-none"
				>
					{recorderStateToIcons[getRecorderStateQuery.data ?? 'IDLE']}
				</span>
			</WhisperingButton>
			<div class="flex-1 flex-justify-center mb-2 flex items-center gap-1.5">
				{#if getRecorderStateQuery.data === 'RECORDING'}
					<WhisperingButton
						tooltipContent="Cancel recording"
						onclick={commandCallbacks.cancelManualRecording}
						variant="ghost"
						size="icon"
						style="view-transition-name: cancel-icon;"
					>
						🚫
					</WhisperingButton>
				{:else}
					<DeviceSelector strategy="navigator" />
					<TranscriptionSelector />
					<TransformationSelector />
				{/if}
			</div>
		{:else if settings.value['recording.mode'] === 'cpal' && window.__TAURI_INTERNALS__}
			<WhisperingButton
				tooltipContent={getCpalStateQuery.data === 'IDLE'
					? 'Start CPAL recording'
					: 'Stop CPAL recording'}
				onclick={commandCallbacks.toggleCpalRecording}
				variant="ghost"
				class="shrink-0 size-32 sm:size-36 lg:size-40 xl:size-44 transform items-center justify-center overflow-hidden duration-300 ease-in-out"
			>
				<span
					style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5)); view-transition-name: microphone-icon;"
					class="text-[100px] sm:text-[110px] lg:text-[120px] xl:text-[130px] leading-none"
				>
					{cpalStateToIcons[getCpalStateQuery.data ?? 'IDLE']}
				</span>
			</WhisperingButton>
			<div class="flex-1 flex-justify-center mb-2 flex items-center gap-1.5">
				{#if getCpalStateQuery.data === 'RECORDING'}
					<WhisperingButton
						tooltipContent="Cancel CPAL recording"
						onclick={commandCallbacks.cancelCpalRecording}
						variant="ghost"
						size="icon"
						style="view-transition-name: cancel-icon;"
					>
						🚫
					</WhisperingButton>
				{:else}
					<DeviceSelector strategy="cpal" />
					<TranscriptionSelector />
					<TransformationSelector />
				{/if}
			</div>
		{:else if settings.value['recording.mode'] === 'vad'}
			<WhisperingButton
				tooltipContent={getVadStateQuery.data === 'IDLE'
					? 'Start voice activated session'
					: 'Stop voice activated session'}
				onclick={commandCallbacks.toggleVadRecording}
				variant="ghost"
				class="shrink-0 size-32 sm:size-36 lg:size-40 xl:size-44 transform items-center justify-center overflow-hidden duration-300 ease-in-out"
			>
				<span
					style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5)); view-transition-name: microphone-icon;"
					class="text-[100px] sm:text-[110px] lg:text-[120px] xl:text-[130px] leading-none"
				>
					{vadStateToIcons[getVadStateQuery.data ?? 'IDLE']}
				</span>
			</WhisperingButton>
			<div class="flex-1 flex-justify-center mb-2 flex items-center gap-1.5">
				{#if getVadStateQuery.data === 'IDLE'}
					<DeviceSelector strategy="navigator" />
					<TranscriptionSelector />
					<TransformationSelector />
				{/if}
			</div>
		{:else if settings.value['recording.mode'] === 'upload'}
			<WhisperingButton
				tooltipContent="Click to upload audio file"
				onclick={() => fileInput?.click()}
				variant="ghost"
				class="shrink-0 size-32 sm:size-36 lg:size-40 xl:size-44 transform items-center justify-center overflow-hidden duration-300 ease-in-out"
			>
				<span
					style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5)); view-transition-name: microphone-icon;"
					class="text-[100px] sm:text-[110px] lg:text-[120px] xl:text-[130px] leading-none"
				>
					📁
				</span>
			</WhisperingButton>
			<input
				type="file"
				accept="audio/*"
				onchange={async (event) => {
					const input = event.target as HTMLInputElement;
					if (input.files && input.files.length > 0) {
						const file = input.files[0];
						await rpc.commands.uploadRecording.execute({ file });
						input.value = '';
					}
				}}
				bind:this={fileInput}
				class="hidden"
			/>
			<div class="flex-1 flex-justify-center mb-2 flex items-center gap-1.5">
				<TranscriptionSelector />
				<TransformationSelector />
			</div>
		{/if}
	</div>

	<div
		class="xxs:flex hidden w-full max-w-sm sm:max-w-md lg:max-w-lg flex-col items-center gap-2"
	>
		<div class="flex w-full items-center gap-2">
			<TranscribedTextDialog
				recordingId={latestRecording.id}
				transcribedText={latestRecording.transcriptionStatus === 'TRANSCRIBING'
					? '...'
					: latestRecording.transcribedText}
				rows={1}
			/>
			<CopyToClipboardButton
				contentDescription="transcribed text"
				textToCopy={latestRecording.transcribedText}
				viewTransitionName={getRecordingTransitionId({
					recordingId: latestRecording.id,
					propertyName: 'transcribedText',
				})}
				size="default"
				variant="secondary"
				disabled={latestRecording.transcriptionStatus === 'TRANSCRIBING'}
			>
				{#if latestRecording.transcriptionStatus === 'TRANSCRIBING'}
					<Loader2Icon class="size-6 animate-spin" />
				{:else}
					<ClipboardIcon class="size-6" />
				{/if}
			</CopyToClipboardButton>
		</div>

		{#if blobUrl}
			<audio
				style="view-transition-name: {getRecordingTransitionId({
					recordingId: latestRecording.id,
					propertyName: 'blob',
				})}"
				src={blobUrl}
				controls
				class="h-8 w-full"
			></audio>
		{/if}
	</div>

	<NavItems class="xs:flex -mb-2.5 -mt-1 hidden" />

	<div class="xs:flex hidden flex-col items-center gap-3">
		<p class="text-foreground/75 text-center text-sm">
			Click the microphone or press
			{' '}<WhisperingButton
				tooltipContent="Go to local shortcut in settings"
				href="/settings/shortcuts/local"
				variant="link"
				size="inline"
			>
				<kbd
					class="bg-muted relative rounded px-[0.3rem] py-[0.15rem] font-mono text-sm font-semibold"
				>
					{settings.value['shortcuts.local.toggleManualRecording']}
				</kbd>
			</WhisperingButton>{' '}
			to start recording here.
		</p>
		{#if window.__TAURI_INTERNALS__}
			<p class="text-foreground/75 text-sm">
				Press
				{' '}<WhisperingButton
					tooltipContent="Go to global shortcut in settings"
					href="/settings/shortcuts/global"
					variant="link"
					size="inline"
				>
					<kbd
						class="bg-muted relative rounded px-[0.3rem] py-[0.15rem] font-mono text-sm font-semibold"
					>
						{settings.value['shortcuts.global.toggleManualRecording']}
					</kbd>
				</WhisperingButton>{' '}
				to start recording anywhere.
			</p>
		{/if}
		<p class="text-muted-foreground text-center text-sm font-light">
			Check out the {' '}<WhisperingButton
				tooltipContent="Check out the Chrome Extension"
				href="https://chromewebstore.google.com/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo"
				target="_blank"
				rel="noopener noreferrer"
				variant="link"
				size="inline"
			>
				extension
			</WhisperingButton>{' '}
			{#if !window.__TAURI_INTERNALS__}
				and {' '}<WhisperingButton
					tooltipContent="Check out the desktop app"
					href="https://github.com/braden-w/whispering/releases"
					target="_blank"
					rel="noopener noreferrer"
					variant="link"
					size="inline"
				>
					app
				</WhisperingButton>{' '}
			{/if} for more integrations!
		</p>
	</div>
</main>
