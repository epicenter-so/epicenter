<script lang="ts">
	import CopyableCode from '$lib/components/copyable/CopyableInlineCode.svelte';
	import CopyablePre from '$lib/components/copyable/CopyablePre.svelte';
	import {
		LabeledInput,
		LabeledSelect,
		LabeledTextarea,
	} from '$lib/components/labeled/index.js';
	import {
		ElevenLabsApiKeyInput,
		GroqApiKeyInput,
		OpenAiApiKeyInput,
	} from '$lib/components/settings';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		GROQ_MODELS,
		SUPPORTED_LANGUAGES_OPTIONS,
		TRANSCRIPTION_SERVICE_OPTIONS,
	} from '$lib/constants';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<svelte:head>
	<title>Transcription Settings - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Transcription</h3>
		<p class="text-muted-foreground text-sm">
			Configure your Whispering transcription preferences.
		</p>
	</div>
	<Separator />

	<LabeledSelect
		id="selected-transcription-service"
		label="Transcription Service"
		items={TRANSCRIPTION_SERVICE_OPTIONS}
		selected={settings.value['transcription.selectedTranscriptionService']}
		onSelectedChange={(selected) => {
			settings.value = {
				...settings.value,
				'transcription.selectedTranscriptionService': selected,
			};
		}}
		placeholder="Select a transcription service"
	/>

	{#if settings.value['transcription.selectedTranscriptionService'] === 'OpenAI'}
		<OpenAiApiKeyInput />
	{:else if settings.value['transcription.selectedTranscriptionService'] === 'Groq'}
		<LabeledSelect
			id="groq-model"
			label="Groq Model"
			items={GROQ_MODELS.map((model) => ({ value: model, label: model }))}
			selected={settings.value['transcription.groq.model']}
			onSelectedChange={(selected) => {
				settings.value = {
					...settings.value,
					'transcription.groq.model': selected,
				};
			}}
		>
			{#snippet description()}
				You can find more details about the models in the <Button
					variant="link"
					class="px-0.3 py-0.2 h-fit"
					href="https://console.groq.com/docs/speech-to-text"
					target="_blank"
					rel="noopener noreferrer"
				>
					Groq docs
				</Button>.
			{/snippet}
		</LabeledSelect>
		<GroqApiKeyInput />
	{:else if settings.value['transcription.selectedTranscriptionService'] === 'ElevenLabs'}
		<ElevenLabsApiKeyInput />
	{:else if settings.value['transcription.selectedTranscriptionService'] === 'speaches'}
		<div class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Speaches Setup</Card.Title>
					<Card.Description>
						Install Speaches server and configure Whispering. Speaches is the successor to faster-whisper-server with improved features and active development.
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6">
					<div class="flex gap-3">
						<Button
							href="https://speaches.ai/installation/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Installation Guide
						</Button>
						<Button
							variant="outline"
							href="https://speaches.ai/usage/speech-to-text/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Speech-to-Text Setup
						</Button>
					</div>

					<div class="space-y-4">
						<div>
							<p class="text-sm font-medium">
								<span class="text-muted-foreground">Step 1:</span> Install Speaches server
							</p>
							<ul class="ml-6 mt-2 space-y-2 text-sm text-muted-foreground">
								<li class="list-disc">
									Download the necessary docker compose files from the <Button
										variant="link"
										size="sm"
										class="px-0 h-auto underline"
										href="https://speaches.ai/installation/"
										target="_blank"
										rel="noopener noreferrer"
									>
										installation guide
									</Button>
								</li>
								<li class="list-disc">
									Choose CUDA, CUDA with CDI, or CPU variant depending on your system
								</li>
							</ul>
						</div>

						<div>
							<p class="text-sm font-medium mb-2">
								<span class="text-muted-foreground">Step 2:</span> Start Speaches container
							</p>
							<CopyablePre
								label="docker compose up --detach"
								hideLabel
								copyableText="docker compose up --detach"
								variant="code"
							/>
						</div>

						<div>
							<p class="text-sm font-medium">
								<span class="text-muted-foreground">Step 3:</span> Download a speech recognition model
							</p>
							<ul class="ml-6 mt-2 space-y-2 text-sm text-muted-foreground">
								<li class="list-disc">
									View available models in the <Button
										variant="link"
										size="sm"
										class="px-0 h-auto underline"
										href="https://speaches.ai/usage/speech-to-text/"
										target="_blank"
										rel="noopener noreferrer"
									>
										speech-to-text guide
									</Button>
								</li>
								<li class="list-disc">
									Run the following command to download a model:
								</li>
							</ul>
							<div class="mt-2">
								<CopyablePre
									label="uvx speaches-cli model download Systran/faster-distil-whisper-small.en"
									hideLabel
									copyableText="uvx speaches-cli model download Systran/faster-distil-whisper-small.en"
									variant="code"
								/>
							</div>
						</div>

						<div>
							<p class="text-sm font-medium">
								<span class="text-muted-foreground">Step 4:</span> Configure the settings below
							</p>
							<ul class="ml-6 mt-2 space-y-1 text-sm text-muted-foreground">
								<li class="list-disc">Enter your Speaches server URL</li>
								<li class="list-disc">Enter the model ID you downloaded</li>
							</ul>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<LabeledInput
			id="speaches-base-url"
			label="Base URL"
			placeholder="http://localhost:8000"
			value={settings.value['transcription.speaches.baseUrl']}
			oninput={({ currentTarget: { value } }) => {
				settings.value = {
					...settings.value,
					'transcription.speaches.baseUrl': value,
				};
			}}
		>
			{#snippet description()}
				<p class="text-muted-foreground text-sm">
					The URL where your Speaches server is running (<code>SPEACHES_BASE_URL</code>), typically <CopyableCode
						copyableText="http://localhost:8000"
					/>
				</p>
			{/snippet}
		</LabeledInput>

		<LabeledInput
			id="speaches-model-id"
			label="Model ID"
			placeholder="Systran/faster-distil-whisper-small.en"
			value={settings.value['transcription.speaches.modelId']}
			oninput={({ currentTarget: { value } }) => {
				settings.value = {
					...settings.value,
					'transcription.speaches.modelId': value,
				};
			}}
		>
			{#snippet description()}
				<p class="text-muted-foreground text-sm">
					The model you downloaded in step 3 (<code>MODEL_ID</code>), e.g. <CopyableCode
						copyableText="Systran/faster-distil-whisper-small.en"
					/>
				</p>
			{/snippet}
		</LabeledInput>
	{/if}

	<LabeledSelect
		id="output-language"
		label="Output Language"
		items={SUPPORTED_LANGUAGES_OPTIONS}
		selected={settings.value['transcription.outputLanguage']}
		onSelectedChange={(selected) => {
			settings.value = {
				...settings.value,
				'transcription.outputLanguage': selected,
			};
		}}
		placeholder="Select a language"
	/>

	<LabeledInput
		id="temperature"
		label="Temperature"
		type="number"
		min="0"
		max="1"
		step="0.1"
		placeholder="0"
		value={settings.value['transcription.temperature']}
		oninput={({ currentTarget: { value } }) => {
			settings.value = {
				...settings.value,
				'transcription.temperature': value,
			};
		}}
		description="Controls randomness in the model's output. 0 is focused and deterministic, 1 is more creative."
	/>

	<LabeledTextarea
		id="transcription-prompt"
		label="System Prompt"
		placeholder="e.g., This is an academic lecture about quantum physics with technical terms like 'eigenvalue' and 'Schrödinger'"
		value={settings.value['transcription.prompt']}
		oninput={({ currentTarget: { value } }) => {
			settings.value = {
				...settings.value,
				'transcription.prompt': value,
			};
		}}
		description="Helps transcription service (e.g., Whisper) better recognize specific terms, names, or context during initial transcription. Not for text transformations - use the Transformations tab for post-processing rules."
	/>
</div>
