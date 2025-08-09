<script lang="ts">
	import { commandCallbacks } from '$lib/commands';
	import NavItems from '$lib/components/NavItems.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import {
		DeviceSelector,
		TranscriptionSelector,
		TransformationSelector,
	} from '$lib/components/settings';
	import {
		recorderStateToIcons,
		vadStateToIcons,
	} from '$lib/constants/audio';
	import { rpc } from '$lib/query';
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '@repo/ui/utils';
	import { createQuery } from '@tanstack/svelte-query';
	import { MediaQuery } from 'svelte/reactivity';

	const getRecorderStateQuery = createQuery(
		rpc.recorder.getRecorderState.options,
	);
	const getVadStateQuery = createQuery(rpc.vadRecorder.getVadState.options);

	let { children } = $props();

	const isMobile = new MediaQuery('(max-width: 640px)');
</script>

<header
	class={cn(
		'border-border/40 bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b shadow-xs backdrop-blur-sm ',
		'flex h-14 w-full items-center px-4 sm:px-8 gap-1.5',
	)}
	style="view-transition-name: header"
>
	<div class="mr-auto flex gap-2">
		<WhisperingButton
			tooltipContent="Go home"
			href="/"
			variant="ghost"
			class="-ml-4"
		>
			<span class="text-lg font-bold">whispering</span>
		</WhisperingButton>
	</div>
	{#if settings.value['recording.mode'] === 'manual'}
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
			<DeviceSelector />
			<TranscriptionSelector />
			<TransformationSelector />
		{/if}
		<WhisperingButton
			tooltipContent={getRecorderStateQuery.data === 'RECORDING'
				? 'Stop recording'
				: 'Start recording'}
			onclick={commandCallbacks.toggleManualRecording}
			variant="ghost"
			size="icon"
			style="view-transition-name: microphone-icon"
		>
			{recorderStateToIcons[getRecorderStateQuery.data ?? 'IDLE']}
		</WhisperingButton>
	{:else if settings.value['recording.mode'] === 'vad'}
		{#if getVadStateQuery.data === 'IDLE'}
			<DeviceSelector />
			<TranscriptionSelector />
			<TransformationSelector />
		{/if}
		<WhisperingButton
			tooltipContent="Toggle voice activated recording"
			onclick={commandCallbacks.toggleVadRecording}
			variant="ghost"
			size="icon"
			style="view-transition-name: microphone-icon"
		>
			{vadStateToIcons[getVadStateQuery.data ?? 'IDLE']}
		</WhisperingButton>
	{:else if settings.value['recording.mode'] === 'live'}
		{#if true}
			<DeviceSelector />
			<TranscriptionSelector />
			<TransformationSelector />
		{/if}
		<WhisperingButton
			tooltipContent="Toggle live recording"
			onclick={() => {
				// TODO: Implement live recording toggle
				alert('Live recording not yet implemented');
			}}
			variant="ghost"
			size="icon"
			style="view-transition-name: microphone-icon"
		>
			🎬
		</WhisperingButton>
	{/if}

	<NavItems class="-mr-4" collapsed={isMobile.current} />
</header>

{@render children()}
