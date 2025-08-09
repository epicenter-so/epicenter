<script lang="ts">
	import { goto } from '$app/navigation';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Badge } from '@repo/ui/badge';
	import * as Command from '@repo/ui/command';
	import * as Popover from '@repo/ui/popover';
	import { useCombobox } from '@repo/ui/hooks';
	import {
		TRANSCRIPTION_SERVICES,
		type TranscriptionService,
	} from '$lib/constants/transcription';
	import {
		getSelectedTranscriptionService,
		isTranscriptionServiceConfigured,
	} from '$lib/settings/transcription-validation';
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '@repo/ui/utils';
	import { CheckIcon, MicIcon, SettingsIcon } from '@lucide/svelte';

	let { class: className }: { class?: string } = $props();

	const selectedService = $derived(getSelectedTranscriptionService());

	function getSelectedModelNameOrUrl(service: TranscriptionService) {
		switch (service.type) {
			case 'api':
				return settings.value[service.modelSettingKey];
			case 'server':
				return settings.value[service.serverUrlField];
		}
	}

	const apiServices = $derived(
		TRANSCRIPTION_SERVICES.filter((service) => service.type === 'api'),
	);

	const serverServices = $derived(
		TRANSCRIPTION_SERVICES.filter((service) => service.type === 'server'),
	);

	const combobox = useCombobox();
</script>

{#snippet renderServiceDisplay(service: TranscriptionService)}
	{@const Icon = service.icon}
	<div class="flex items-center gap-2">
		<Icon class="size-4 shrink-0" />
		<span class="font-medium truncate">
			{service.name}
		</span>
	</div>
{/snippet}

<Popover.Root bind:open={combobox.open}>
	<Popover.Trigger bind:ref={combobox.triggerRef}>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
				class={cn('relative', className)}
				tooltipContent={selectedService
					? `Current transcription service: ${selectedService.name}(${getSelectedModelNameOrUrl(
							selectedService,
						)})`
					: 'Select a transcription service'}
				role="combobox"
				aria-expanded={combobox.open}
				variant="ghost"
				size="icon"
			>
				{#if selectedService}
					{@const SelectedIcon = selectedService.icon}
					<SelectedIcon
						class={cn(
							'size-4',
							isTranscriptionServiceConfigured(selectedService)
								? 'text-green-500'
								: 'text-amber-500',
						)}
					/>
				{:else}
					<MicIcon class="size-4 text-muted-foreground" />
				{/if}
				{#if selectedService && !isTranscriptionServiceConfigured(selectedService)}
					<span
						class="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-500 before:absolute before:left-0 before:top-0 before:h-full before:w-full before:rounded-full before:bg-amber-500/50 before:animate-ping"
					></span>
				{/if}
			</WhisperingButton>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 max-w-xl p-0">
		<Command.Root loop>
			<Command.Input placeholder="Select transcription service..." />
			<Command.List class="overflow-y-auto max-h-[400px]">
				<Command.Empty>No service found.</Command.Empty>

				{#each apiServices as service (service.id)}
					{@const isSelected =
						settings.value['transcription.selectedTranscriptionService'] ===
						service.id}
					{@const isConfigured = isTranscriptionServiceConfigured(service)}
					{@const currentSelectedModelName = getSelectedModelNameOrUrl(service)}

					<Command.Group heading={service.name}>
						{#each service.models as model}
							{@const isModelSelected =
								isSelected && currentSelectedModelName === model.name}
							{@const Icon = service.icon}
							<Command.Item
								value="{service.id}-{model.name}"
								onSelect={() => {
									settings.update({
										'transcription.selectedTranscriptionService': service.id,
										[service.modelSettingKey]: model.name,
									});
									combobox.closeAndFocusTrigger();
								}}
								class="flex items-center gap-2 p-2"
							>
								<CheckIcon
									class={cn('size-4 shrink-0 ml-2', {
										'text-transparent': !isModelSelected,
									})}
								/>
								<div class="flex flex-col min-w-0">
									<div class="flex items-center gap-2">
										<Icon class="size-4 shrink-0" />
										<span class="font-medium">{model.name}</span>
									</div>
									{#if !isConfigured}
										<span class="text-sm text-amber-600 ml-6"
											>API key required</span
										>
									{/if}
								</div>
							</Command.Item>
						{/each}
					</Command.Group>
				{/each}

				{#each serverServices as service (service.id)}
					{@const isSelected =
						settings.value['transcription.selectedTranscriptionService'] ===
						service.id}
					{@const isConfigured = isTranscriptionServiceConfigured(service)}

					<Command.Group heading={service.name}>
						<Command.Item
							value={service.id}
							onSelect={() => {
								settings.updateKey('transcription.selectedTranscriptionService', service.id);
								combobox.closeAndFocusTrigger();
							}}
							class="flex items-center gap-2 p-2"
						>
							<CheckIcon
								class={cn('size-4 shrink-0 ml-2', {
									'text-transparent': !isSelected,
								})}
							/>
							<div class="flex flex-col min-w-0">
								{@render renderServiceDisplay(service)}
								{#if !isConfigured}
									<span class="text-sm text-amber-600 ml-6">
										Server URL required
									</span>
								{/if}
							</div>
						</Command.Item>
					</Command.Group>
				{/each}
			</Command.List>
			<Command.Item
				value="Configure transcription"
				onSelect={() => {
					goto('/settings/transcription');
					combobox.closeAndFocusTrigger();
				}}
				class="rounded-none p-2 bg-muted/50 text-muted-foreground"
			>
				<SettingsIcon class="size-4 mx-2.5" />
				Configure transcription
			</Command.Item>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
