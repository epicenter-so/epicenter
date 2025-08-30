<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { rpc } from '$lib/query';
	import { settings } from '$lib/stores/settings.svelte';
	import { CheckIcon, MicIcon, RefreshCwIcon } from '@lucide/svelte';
	import * as Command from '@repo/ui/command';
	import { useCombobox } from '@repo/ui/hooks';
	import * as Popover from '@repo/ui/popover';
	import { cn } from '@repo/ui/utils';
	import { createQuery } from '@tanstack/svelte-query';

	let {
		mode = 'manual'
	}: {
		mode: 'manual' | 'vad'
	} = $props();

	const combobox = useCombobox();
	
	// Setting key is based on mode
	const settingKey = $derived(
		mode === 'vad' 
			? 'recording.vad.selectedDeviceId'
			: 'recording.manual.selectedDeviceId'
	) 
	
	// Determine which backend to use for device enumeration
	// VAD always uses browser, manual uses the configured backend
	const isUsingBrowserBackend = $derived(
		mode === 'vad' || 
		!window.__TAURI_INTERNALS__ ||
		settings.value['recording.backend'] === 'browser'
	);
	
	const selectedDeviceId = $derived(settings.value[settingKey]);
	
	const isDeviceSelected = $derived(!!selectedDeviceId);

	const getDevicesQuery = createQuery(() => ({
		...(isUsingBrowserBackend 
			? rpc.vadRecorder.enumerateDevices.options()
			: rpc.recorder.enumerateDevices.options()),
		enabled: combobox.open,
	}));

	$effect(() => {
		if (getDevicesQuery.isError) {
			rpc.notify.warning.execute(
				getDevicesQuery.error
			);
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
						{getDevicesQuery.error.title}
					</div>
				{:else}
					{#each getDevicesQuery.data as device (device.id)}
						<Command.Item
							value={device.id}
							onSelect={() => {
								const currentDeviceId = selectedDeviceId;
								settings.updateKey(
									settingKey,
									currentDeviceId === device.id ? null : device.id,
								);
								combobox.closeAndFocusTrigger();
							}}
							class="flex items-center gap-2 p-2"
						>
							<CheckIcon
								class={cn(
									'size-4 shrink-0 mx-2',
									selectedDeviceId !== device.id && 'text-transparent',
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
