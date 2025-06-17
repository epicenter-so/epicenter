<script lang="ts">
	import { commandCallbacks } from '$lib/commands';
	import NavItems from '$lib/components/NavItems.svelte';
	import TranscriptionServiceSelector from '$lib/components/TranscriptionServiceSelector.svelte';
	import TransformationSelector from '$lib/components/TransformationSelector.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import CopyToClipboardButton from '$lib/components/copyable/CopyToClipboardButton.svelte';
	import DeviceSelector from '$lib/components/device-selectors/DeviceSelector.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { rpc } from '$lib/query';
	import type { Recording } from '$lib/services/db';
	import { settings } from '$lib/stores/settings.svelte';
	import { createBlobUrlManager } from '$lib/utils/blobUrlManager';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import {
		recorderStateToIcons,
		RECORDING_MODE_OPTIONS,
		vadStateToIcons,
	} from '@repo/shared';
	import { createQuery } from '@tanstack/svelte-query';
	import { Loader2Icon } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import TranscribedTextDialog from './(config)/recordings/TranscribedTextDialog.svelte';

	const getRecorderStateQuery = createQuery(
		rpc.manualRecorder.getRecorderState.options,
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

	onDestroy(() => {
		blobUrlManager.revokeCurrentUrl();
	});
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<main class="flex flex-1 flex-col items-center justify-center gap-4">
	<div class="xs:flex hidden flex-col items-center gap-4">
		<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
			Start recording
		</h1>
		<p class="text-muted-foreground text-center">
			Click the 🎙 button to start. Allow access to your microphone.
		</p>
	</div>

	<ToggleGroup.Root
		type="single"
		value={settings.value['recording.mode']}
		class="max-w-xs w-full grid grid-cols-2 gap-2"
		onValueChange={(mode) => {
			settings.value = {
				...settings.value,
				'recording.mode': mode as 'manual' | 'vad' | 'live',
			};
		}}
	>
		{#each RECORDING_MODE_OPTIONS as option}
			<ToggleGroup.Item
				value={option.value}
				aria-label={`Switch to ${option.label.toLowerCase()} mode`}
			>
				{option.icon}
				{option.label}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>

	<div class="max-w-md flex items-end justify-between w-full gap-2 pt-1">
		<div class="flex-1"></div>
		{#if settings.value['recording.mode'] === 'manual'}
			{@const currentMethod = settings.value[`recording.manual.method`]}
			<WhisperingButton
				tooltipContent={getRecorderStateQuery.data === 'IDLE'
					? 'Start recording'
					: 'Stop recording'}
				onclick={commandCallbacks.toggleManualRecording}
				variant="ghost"
				class="shrink-0 size-32 transform items-center justify-center overflow-hidden duration-300 ease-in-out"
			>
				<span
					style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5)); view-transition-name: microphone-icon;"
					class="text-[100px] leading-none"
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
					<DeviceSelector
						settingsKey="recording.manual.{currentMethod}.selectedDeviceId"
					/>
					<TranscriptionServiceSelector />
					<TransformationSelector />
				{/if}
			</div>
		{:else if settings.value['recording.mode'] === 'vad'}
			{@const currentMethod = settings.value[`recording.vad.method`]}
			<WhisperingButton
				tooltipContent={getVadStateQuery.data === 'IDLE'
					? 'Start voice activated session'
					: 'Stop voice activated session'}
				onclick={commandCallbacks.toggleVadRecording}
				variant="ghost"
				class="shrink-0 size-32 transform items-center justify-center overflow-hidden duration-300 ease-in-out"
			>
				<span
					style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5)); view-transition-name: microphone-icon;"
					class="text-[100px] leading-none"
				>
					{vadStateToIcons[getVadStateQuery.data ?? 'IDLE']}
				</span>
			</WhisperingButton>
			<div class="flex-1 flex-justify-center mb-2 flex items-center gap-1.5">
				{#if getVadStateQuery.data === 'IDLE'}
					<DeviceSelector
						settingsKey="recording.vad.{currentMethod}.selectedDeviceId"
					/>
					<TranscriptionServiceSelector />
					<TransformationSelector />
				{/if}
			</div>
		{/if}
	</div>

	<div class="xxs:flex hidden w-full max-w-xs flex-col items-center gap-2">
		<div class="flex w-full items-center gap-2">
			<TranscribedTextDialog
				recordingId={latestRecording.id}
				transcribedText={latestRecording.transcriptionStatus === 'TRANSCRIBING'
					? '...'
					: latestRecording.transcribedText}
				rows={1}
			/>
			<CopyToClipboardButton
				contentName="transcribed text"
				copyableText={latestRecording.transcribedText}
				viewTransitionName={getRecordingTransitionId({
					recordingId: latestRecording.id,
					propertyName: 'transcribedText',
				})}
				size="default"
				variant="secondary"
				disabled={latestRecording.transcriptionStatus === 'TRANSCRIBING'}
			>
				{#snippet copyIcon()}
					{#if latestRecording.transcriptionStatus === 'TRANSCRIBING'}
						<Loader2Icon class="size-6 animate-spin" />
					{:else}
						<ClipboardIcon class="size-6" />
					{/if}
				{/snippet}
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
				href="/settings/shortcuts"
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
					href="/settings/shortcuts"
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
