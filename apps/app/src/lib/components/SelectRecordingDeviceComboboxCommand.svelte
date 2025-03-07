<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { useGetMediaDevices } from '$lib/query/audio/queries';
	import { getManualRecorderFromContext } from '$lib/query/singletons/manualRecorder';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '$lib/utils';
	import { CheckIcon, RefreshCwIcon } from 'lucide-svelte';
	import { combobox } from './SelectRecordingDeviceCombobox.svelte';

	const manualRecorder = getManualRecorderFromContext();
	const { getMediaDevicesQuery } = useGetMediaDevices();

	$effect(() => {
		if (getMediaDevicesQuery.isError) {
			toast.warning(getMediaDevicesQuery.error);
		}
	});
</script>

<Command.Root loop>
	<Command.Input placeholder="Select recording device..." />
	<Command.Empty>No recording devices found.</Command.Empty>
	<Command.Group class="overflow-y-auto max-h-[400px]">
		{#if getMediaDevicesQuery.isPending}
			<div class="p-4 text-center text-sm text-muted-foreground">
				Loading devices...
			</div>
		{:else if getMediaDevicesQuery.isError}
			<div class="p-4 text-center text-sm text-destructive">
				{getMediaDevicesQuery.error.title}: {getMediaDevicesQuery.error
					.description}
			</div>
		{:else}
			{#each getMediaDevicesQuery.data as device (device.deviceId)}
				<Command.Item
					value={device.label}
					onSelect={() => {
						manualRecorder.closeRecordingSessionSilent();
						settings.value = {
							...settings.value,
							'recording.selectedAudioInputDeviceId':
								settings.value['recording.selectedAudioInputDeviceId'] ===
								device.deviceId
									? null
									: device.deviceId,
						};
						combobox.closeAndFocusTrigger();
					}}
					class="flex items-center gap-2 p-2"
				>
					<CheckIcon
						class={cn(
							'h-4 w-4 flex-shrink-0 mx-2',
							settings.value['recording.selectedAudioInputDeviceId'] !==
								device.deviceId && 'text-transparent',
						)}
					/>
					<div class="flex flex-col min-w-0">
						<span class="font-medium truncate">
							{device.label}
						</span>
					</div>
				</Command.Item>
			{/each}
		{/if}
	</Command.Group>
	<Command.Item
		value="Refresh devices"
		onSelect={() => {
			void getMediaDevicesQuery.refetch();
			combobox.closeAndFocusTrigger();
		}}
		class="rounded-none p-2 bg-muted/50 text-muted-foreground"
	>
		<RefreshCwIcon class="h-4 w-4 mx-2.5" />
		Refresh devices
	</Command.Item>
</Command.Root>
