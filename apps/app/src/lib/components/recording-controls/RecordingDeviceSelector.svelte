<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { getSelectedAudioInputDeviceId } from '$lib/services/_deviceSelection';
	import { MicIcon } from 'lucide-svelte';
	import WhisperingButton from '../WhisperingButton.svelte';
	import RecordingDeviceSelectorCommand from './RecordingDeviceSelectorCommand.svelte';
	import { combobox } from './_combobox';

	let { class: className }: { class?: string } = $props();

	const isDeviceSelected = $derived(!!getSelectedAudioInputDeviceId());
</script>

<Popover.Root bind:open={combobox.open}>
	<Popover.Trigger bind:ref={combobox.triggerRef}>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
				class={className}
				tooltipContent={isDeviceSelected
					? 'Change recording device'
					: 'Select a recording device'}
				role="combobox"
				aria-expanded={combobox.open}
				variant="ghost"
				size="icon"
			>
				{#if isDeviceSelected}
					<MicIcon class="size-4 text-green-500" />
				{:else}
					<MicIcon class="size-4 text-amber-500" />
				{/if}
			</WhisperingButton>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 max-w-xl p-0">
		<RecordingDeviceSelectorCommand></RecordingDeviceSelectorCommand>
	</Popover.Content>
</Popover.Root>
