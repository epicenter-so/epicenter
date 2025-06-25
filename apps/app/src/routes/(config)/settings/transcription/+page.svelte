<script lang="ts">
	import CopyablePre from '$lib/components/copyable/CopyablePre.svelte';
	import {
		LabeledInput,
		LabeledSelect,
		LabeledTextarea,
	} from '$lib/components/labeled/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { settings } from '$lib/stores/settings.svelte';
	import {
		GROQ_MODELS_OPTIONS,
		SUPPORTED_LANGUAGES_OPTIONS,
		TRANSCRIPTION_SERVICE_OPTIONS,
		WHISPERING_URL,
	} from '$lib/constants';
	import {
		ElevenLabsApiKeyInput,
		GroqApiKeyInput,
		OpenAiApiKeyInput,
	} from '$lib/components/settings';
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
			items={GROQ_MODELS_OPTIONS}
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
	{:else if settings.value['transcription.selectedTranscriptionService'] === 'faster-whisper-server'}
		<Card.Root class="w-full">
			<Card.Header>
				<Card.Title class="text-xl">
					How to setup local Whisper API with
					<code
						class="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono font-semibold"
					>
						faster-whisper-server
					</code>
				</Card.Title>
				<Card.Description class="leading-7">
					<p>
						Ensure Docker or an equivalent (e.g., Orbstack) is installed on your
						computer.
					</p>
					<p>Then run the following command in terminal:</p>
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Tabs.Root value="cpu-mode">
					<Tabs.List
						class="w-full justify-start rounded-none border-b bg-transparent p-0"
					>
						<Tabs.Trigger
							value="cpu-mode"
							class="text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold shadow-none transition-none data-[state=active]:shadow-none"
						>
							CPU Mode
						</Tabs.Trigger>
						<Tabs.Trigger
							value="gpu-mode"
							class="text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold shadow-none transition-none data-[state=active]:shadow-none"
						>
							GPU Mode
						</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value="cpu-mode">
						<CopyablePre
							variant="code"
							label="For computers without CUDA support:"
							copyableText={`docker run -e ALLOW_ORIGINS='["${WHISPERING_URL}"]' --publish 8000:8000 --volume ~/.cache/huggingface:/root/.cache/huggingface fedirz/faster-whisper-server:latest-cpu`}
						/>
					</Tabs.Content>
					<Tabs.Content value="gpu-mode">
						<CopyablePre
							variant="code"
							label="For computers with CUDA support:"
							copyableText={`docker run -e ALLOW_ORIGINS='["${WHISPERING_URL}"]' --gpus=all --publish 8000:8000 --volume ~/.cache/huggingface:/root/.cache/huggingface fedirz/faster-whisper-server:latest-cuda`}
						/>
					</Tabs.Content>
				</Tabs.Root>
			</Card.Content>
		</Card.Root>

		<LabeledInput
			id="faster-whisper-server-url"
			label="faster-whisper-server URL"
			placeholder="Your faster-whisper-server URL"
			value={settings.value['transcription.fasterWhisperServer.serverUrl']}
			oninput={({ currentTarget: { value } }) => {
				settings.value = {
					...settings.value,
					'transcription.fasterWhisperServer.serverUrl': value,
				};
			}}
		/>

		<LabeledInput
			id="faster-whisper-server-model"
			label="faster-whisper-server Model"
			placeholder="Your faster-whisper-server Model"
			value={settings.value['transcription.fasterWhisperServer.serverModel']}
			oninput={({ currentTarget: { value } }) => {
				settings.value = {
					...settings.value,
					'transcription.fasterWhisperServer.serverModel': value,
				};
			}}
		/>
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
