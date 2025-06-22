<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { useCombobox } from '$lib/components/useCombobox.svelte';
	import { rpc } from '$lib/query';
	import type { DeviceEnumerationStrategy } from '$lib/query/_queries/device';
	import type { Settings } from '$lib/settings';
	import { settings } from '$lib/stores/settings.svelte';
	import { toast } from '$lib/toast';
	import { cn } from '$lib/utils';
	import { createQuery } from '@tanstack/svelte-query';
	import { CheckIcon, MicIcon, RefreshCwIcon } from 'lucide-svelte';

	const combobox = useCombobox();

	let {
		deviceEnumerationStrategy,
		settingsKey,
	}: {
		deviceEnumerationStrategy: DeviceEnumerationStrategy;
		settingsKey: keyof Settings;
	} = $props();

	const selectedDeviceId = $derived(settings.value[settingsKey]);
	function setSelectedDeviceId(deviceId: string | null) {
		settings.value = {
			...settings.value,
			[settingsKey]: deviceId,
		};
	}

	const isDeviceSelected = $derived(!!selectedDeviceId);

	const getDevicesQuery = createQuery(() => ({
		...rpc.device.getDevices(deviceEnumerationStrategy).options(),
		enabled: combobox.open,
	}));

	$effect(() => {
		if (getDevicesQuery.isError) {
			toast.warning({
				title: 'Error loading devices',
				description: getDevicesQuery.error.message,
			});
		}
	});
</script>

<Popover.Root bind:open={combobox.open}>
	<Popover.Trigger bind:ref={combobox.triggerRef}>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
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
				{#if getDevicesQuery.isPending}
					<div class="p-4 text-center text-sm text-muted-foreground">
						Loading devices...
					</div>
				{:else if getDevicesQuery.isError}
					<div class="p-4 text-center text-sm text-destructive">
						{getDevicesQuery.error.message}
					</div>
				{:else}
					{#each getDevicesQuery.data as device (device.deviceId)}
						<Command.Item
							value={device.label}
							onSelect={() => {
								const currentDeviceId = selectedDeviceId;
								setSelectedDeviceId(
									currentDeviceId === device.deviceId ? null : device.deviceId,
								);
								combobox.closeAndFocusTrigger();
							}}
							class="flex items-center gap-2 p-2"
						>
							<CheckIcon
								class={cn(
									'size-4 shrink-0 mx-2',
									selectedDeviceId !== device.deviceId && 'text-transparent',
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
					getDevicesQuery.refetch();
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
