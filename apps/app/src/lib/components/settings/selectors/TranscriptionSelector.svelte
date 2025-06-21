<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '$lib/utils';
	import {
		TRANSCRIPTION_SERVICES,
		type TranscriptionService,
	} from '$lib/constants';
	import { CheckIcon, MicIcon, SettingsIcon } from 'lucide-svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { useCombobox } from '$lib/components/useCombobox.svelte';

	let { class: className }: { class?: string } = $props();

	const selectedService = $derived(
		TRANSCRIPTION_SERVICES.find(
			(s) =>
				s.id === settings.value['transcription.selectedTranscriptionService'],
		),
	);

	const isServiceConfigured = (service: TranscriptionService) => {
		switch (service.type) {
			case 'api': {
				const apiKey = settings.value[service.apiKeyField];
				return apiKey && apiKey !== '';
			}
			case 'server': {
				const url = settings.value[service.serverUrlField];
				return url && url !== '';
			}
			default: {
				return true;
			}
		}
	};

	const getSelectedModel = (service: TranscriptionService) => {
		if (service.type !== 'api') return null;
		return settings.value[service.modelSettingKey] ?? service.defaultModel;
	};

	// Generic model name formatter
	const formatModelName = (model: string) => {
		return model;
		// .replace('distil-', 'd-')
		// .replace('-turbo', '-t')
		// .replace('large-', 'lg-')
		// .replace('-versatile', '-v');
	};

	const combobox = useCombobox();
</script>

{#snippet renderServiceDisplay(service: TranscriptionService)}
	{@const Icon = service.icon}
	<div class="flex items-center gap-2">
		<Icon class="size-4 shrink-0" />
		<span class="font-medium truncate">
			{service.name}
		</span>
		{#if selectedService?.id === service.id}
			{@const selectedModel = getSelectedModel(service)}
			{#if selectedModel}
				<Badge variant="outline" class="shrink-0 text-xs">
					{formatModelName(selectedModel)}
				</Badge>
			{/if}
		{/if}
	</div>
{/snippet}

<Popover.Root bind:open={combobox.open}>
	<Popover.Trigger bind:ref={combobox.triggerRef}>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
				class={cn('relative', className)}
				tooltipContent={selectedService
					? `Current transcription service: ${selectedService.name}`
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
							isServiceConfigured(selectedService)
								? 'text-green-500'
								: 'text-amber-500',
						)}
					/>
				{:else}
					<MicIcon class="size-4 text-muted-foreground" />
				{/if}
				{#if selectedService && !isServiceConfigured(selectedService)}
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
			<Command.Empty>No service found.</Command.Empty>
			<Command.Group class="overflow-y-auto max-h-[400px]">
				{#each TRANSCRIPTION_SERVICES as service (service.id)}
					{@const isSelected =
						settings.value['transcription.selectedTranscriptionService'] ===
						service.id}
					{@const isConfigured = isServiceConfigured(service)}
					<Command.Item
						value="{service.id} - {service.name}"
						onSelect={() => {
							settings.value = {
								...settings.value,
								'transcription.selectedTranscriptionService': service.id,
							};
							combobox.closeAndFocusTrigger();
						}}
						class="flex items-center gap-2 p-2"
					>
						<CheckIcon
							class={cn('size-4 shrink-0 mx-2', {
								'text-transparent': !isSelected,
							})}
						/>
						<div class="flex flex-col min-w-0">
							{@render renderServiceDisplay(service)}
							<div
								class="flex items-center gap-2 text-sm text-muted-foreground"
							>
								{#if service.type === 'api'}
									{#if isConfigured}
										<span class="text-green-600">API key configured</span>
									{:else}
										<span class="text-amber-600">API key required</span>
									{/if}
								{:else if service.type === 'server'}
									{#if isConfigured}
										<span class="text-green-600">Server URL configured</span>
									{:else}
										<span class="text-amber-600">Server URL required</span>
									{/if}
								{/if}
							</div>
						</div>
					</Command.Item>
					{#if service.type === 'api' && isSelected}
						<Command.Group class="ml-8 border-l-2 border-muted">
							{#each service.models as model}
								{@const currentSelectedModel = getSelectedModel(service)}
								{@const isModelSelected = currentSelectedModel === model}
								<Command.Item
									value="{service.id}-model-{model}"
									onSelect={() => {
										if (service.modelSettingKey) {
											settings.value = {
												...settings.value,
												[service.modelSettingKey]: model,
											};
										}
									}}
									class="flex items-center gap-2 p-2 pl-4"
								>
									<CheckIcon
										class={cn('size-3 shrink-0', {
											'text-transparent': !isModelSelected,
										})}
									/>
									<span class="text-sm">
										{formatModelName(model)}
									</span>
								</Command.Item>
							{/each}
						</Command.Group>
					{/if}
				{/each}
			</Command.Group>
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
