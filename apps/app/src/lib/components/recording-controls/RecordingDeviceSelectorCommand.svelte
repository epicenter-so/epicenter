<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { rpc } from '$lib/query';
	import {
		getSelectedAudioInputDeviceId,
		setSelectedAudioInputDeviceId,
	} from '$lib/services/_deviceSelection';
	import { toast } from '$lib/toast';
	import { cn } from '$lib/utils';
	import { createQuery, noop } from '@tanstack/svelte-query';
	import { CheckIcon, RefreshCwIcon } from 'lucide-svelte';
	import { combobox } from './index';

	const getMediaDevicesQuery = createQuery(
		rpc.recorder.getMediaDevices.options,
	);

	$effect(() => {
		if (getMediaDevicesQuery.isError) {
			toast.warning({
				title: 'Error loading devices',
				description: getMediaDevicesQuery.error.message,
			});
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
				{getMediaDevicesQuery.error.message}
			</div>
		{:else}
			{#each getMediaDevicesQuery.data as device (device.deviceId)}
				<Command.Item
					value={device.label}
					onSelect={() => {
						const currentDeviceId = getSelectedAudioInputDeviceId();
						setSelectedAudioInputDeviceId(
							currentDeviceId === device.deviceId ? null : device.deviceId,
						);
						combobox.closeAndFocusTrigger();
					}}
					class="flex items-center gap-2 p-2"
				>
					<CheckIcon
						class={cn(
							'size-4 shrink-0 mx-2',
							getSelectedAudioInputDeviceId() !== device.deviceId &&
								'text-transparent',
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
			getMediaDevicesQuery.refetch();
			combobox.closeAndFocusTrigger();
		}}
		class="rounded-none p-2 bg-muted/50 text-muted-foreground"
	>
		<RefreshCwIcon class="size-4 mx-2.5" />
		Refresh devices
	</Command.Item>
</Command.Root>
