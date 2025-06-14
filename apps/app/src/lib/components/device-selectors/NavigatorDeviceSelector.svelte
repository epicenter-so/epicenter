<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { rpc } from '$lib/query';
	import { toast } from '$lib/toast';
	import { cn } from '$lib/utils';
	import { settings } from '$lib/stores/settings.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { CheckIcon, MicIcon, RefreshCwIcon } from 'lucide-svelte';
	import WhisperingButton from '../WhisperingButton.svelte';
	import { useCombobox } from '../useCombobox.svelte';

	const combobox = useCombobox();

	let { class: className }: { class?: string } = $props();

	const selectedDeviceId = $derived(settings.value['recording.navigator.selectedDeviceId']);
	const isDeviceSelected = $derived(!!selectedDeviceId);

	const getMediaDevicesQuery = createQuery(() => ({
		...rpc.recorder.getMediaDevices.options(),
		enabled: combobox.open,
	}));

	$effect(() => {
		if (getMediaDevicesQuery.isError) {
			toast.warning({
				title: 'Error loading devices',
				description: getMediaDevicesQuery.error.message,
			});
		}
	});

	function updateSelectedDevice(deviceId: string | null) {
		settings.value = {
			...settings.value,
			'recording.navigator.selectedDeviceId': deviceId,
		};
	}
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
								const currentDeviceId = selectedDeviceId;
								updateSelectedDevice(
									currentDeviceId === device.deviceId ? null : device.deviceId,
								);
								combobox.closeAndFocusTrigger();
							}}
							class="flex items-center gap-2 p-2"
						>
							<CheckIcon
								class={cn(
									'size-4 shrink-0 mx-2',
									selectedDeviceId !== device.deviceId &&
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
	</Popover.Content>
</Popover.Root>