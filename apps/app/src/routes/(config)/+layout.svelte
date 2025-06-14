<script lang="ts">
	import { commandCallbacks } from '$lib/commands';
	import NavItems from '$lib/components/NavItems.svelte';
	import TransformationSelector from '$lib/components/TransformationSelector.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import NavigatorDeviceSelector from '$lib/components/device-selectors/NavigatorDeviceSelector.svelte';
	import TauriDeviceSelector from '$lib/components/device-selectors/TauriDeviceSelector.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { rpc } from '$lib/query';
	import { cn } from '$lib/utils.js';
	import { recorderStateToIcons } from '@repo/shared';
	import { createQuery } from '@tanstack/svelte-query';

	const getRecorderStateQuery = createQuery(
		rpc.recorder.getRecorderState.options,
	);

	let { children } = $props();
</script>

<header
	class={cn(
		'border-border/40 bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b shadow-xs backdrop-blur-sm ',
		'flex h-14 w-full items-center px-4 md:px-8 gap-1.5',
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
		{#if settings.value['recording.method'] === 'navigator'}
			<NavigatorDeviceSelector />
		{:else}
			<TauriDeviceSelector />
		{/if}
		<TransformationSelector />
	{/if}
	<WhisperingButton
		tooltipContent="Toggle recording"
		onclick={commandCallbacks.toggleManualRecording}
		variant="ghost"
		size="icon"
		style="view-transition-name: microphone-icon"
	>
		{recorderStateToIcons[getRecorderStateQuery.data ?? 'IDLE']}
	</WhisperingButton>
	<NavItems class="-mr-4" />
</header>

{@render children()}
