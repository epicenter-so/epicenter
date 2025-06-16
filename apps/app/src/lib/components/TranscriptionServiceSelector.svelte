<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '$lib/utils';
	import { GROQ_MODELS, TRANSCRIPTION_SERVICES } from '@repo/shared';
	import {
		CheckIcon,
		CloudIcon,
		HexagonIcon,
		MicIcon,
		PauseIcon,
		ServerIcon,
		SettingsIcon,
	} from 'lucide-svelte';
	import WhisperingButton from './WhisperingButton.svelte';
	import { Badge } from './ui/badge';
	import { useCombobox } from './useCombobox.svelte';

	type TranscriptionService = (typeof TRANSCRIPTION_SERVICES)[number];

	interface ServiceConfig {
		id: TranscriptionService;
		name: string;
		icon: typeof MicIcon;
		requiresApiKey?: boolean;
		requiresUrl?: boolean;
		models?: readonly string[];
	}

	const services: ServiceConfig[] = [
		{
			id: 'OpenAI',
			name: 'OpenAI Whisper',
			icon: HexagonIcon,
			requiresApiKey: true,
		},
		{
			id: 'Groq',
			name: 'Groq Whisper',
			icon: CloudIcon,
			requiresApiKey: true,
			models: GROQ_MODELS,
		},
		{
			id: 'ElevenLabs',
			name: 'ElevenLabs',
			icon: PauseIcon,
			requiresApiKey: true,
		},
		{
			id: 'faster-whisper-server',
			name: 'Faster Whisper Server',
			icon: ServerIcon,
			requiresUrl: true,
		},
	];

	let {
		class: className,
	}: {
		class?: string;
	} = $props();

	const selectedService = $derived(
		services.find(
			(s) =>
				s.id === settings.value['transcription.selectedTranscriptionService'],
		),
	);

	const isServiceConfigured = (service: ServiceConfig) => {
		if (service.requiresApiKey) {
			switch (service.id) {
				case 'OpenAI': {
					const apiKey = settings.value['apiKeys.openai'];
					return apiKey && apiKey !== '';
				}
				case 'Groq': {
					const apiKey = settings.value['apiKeys.groq'];
					return apiKey && apiKey !== '';
				}
				case 'ElevenLabs': {
					const apiKey = settings.value['apiKeys.elevenlabs'];
					return apiKey && apiKey !== '';
				}
				default:
					return false;
			}
		}
		if (service.requiresUrl) {
			const url = settings.value['transcription.fasterWhisperServer.serverUrl'];
			return url && url !== '';
		}
		return true;
	};

	const selectedGroqModel = $derived(
		settings.value['transcription.groq.model'] || 'whisper-large-v3',
	);

	const combobox = useCombobox();
</script>

{#snippet renderServiceDisplay(service: ServiceConfig)}
	{@const Icon = service.icon}
	<div class="flex items-center gap-2">
		<Icon class="size-4 shrink-0" />
		<span class="font-medium truncate">
			{service.name}
		</span>
		{#if service.id === 'Groq' && selectedService?.id === 'Groq'}
			<Badge variant="outline" class="shrink-0 text-xs">
				{selectedGroqModel.replace('whisper-', '').replace('distil-', 'd-')}
			</Badge>
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
						class={cn('size-4', {
							'text-green-500': isServiceConfigured(selectedService),
							'text-amber-500': !isServiceConfigured(selectedService),
						})}
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
				{#each services as service (service.id)}
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
								{#if service.requiresApiKey}
									{#if isConfigured}
										<span class="text-green-600">API key configured</span>
									{:else}
										<span class="text-amber-600">API key required</span>
									{/if}
								{:else if service.requiresUrl}
									{#if isConfigured}
										<span class="text-green-600">Server URL configured</span>
									{:else}
										<span class="text-amber-600">Server URL required</span>
									{/if}
								{/if}
							</div>
						</div>
					</Command.Item>
					{#if service.models && isSelected}
						<Command.Group class="ml-8 border-l-2 border-muted">
							{#each service.models as model}
								{@const isModelSelected = selectedGroqModel === model}
								<Command.Item
									value="{service.id}-model-{model}"
									onSelect={() => {
										settings.value = {
											...settings.value,
											'transcription.groq.model':
												model as (typeof settings.value)['transcription.groq.model'],
										};
									}}
									class="flex items-center gap-2 p-2 pl-4"
								>
									<CheckIcon
										class={cn('size-3 shrink-0', {
											'text-transparent': !isModelSelected,
										})}
									/>
									<span class="text-sm">
										{model}
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
