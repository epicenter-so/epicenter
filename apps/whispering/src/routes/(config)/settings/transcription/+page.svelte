<script lang="ts">
	import CopyablePre from '$lib/components/copyable/CopyablePre.svelte';
	import CopyToClipboardButton from '$lib/components/copyable/CopyToClipboardButton.svelte';
	import {
		LabeledInput,
		LabeledSelect,
		LabeledTextarea,
	} from '$lib/components/labeled/index.js';
	import {
		DeepgramApiKeyInput,
		ElevenLabsApiKeyInput,
		GroqApiKeyInput,
		OpenAiApiKeyInput,
	} from '$lib/components/settings';
	import WhisperModelSelector from '$lib/components/settings/WhisperModelSelector.svelte';
	import { SUPPORTED_LANGUAGES_OPTIONS, type SupportedLanguage } from '$lib/constants/languages';
	import {
		DEEPGRAM_TRANSCRIPTION_MODELS,
		ELEVENLABS_TRANSCRIPTION_MODELS,
		GROQ_MODELS,
		OPENAI_TRANSCRIPTION_MODELS,
		TRANSCRIPTION_SERVICE_OPTIONS,
	} from '$lib/constants/transcription';
	import { settings } from '$lib/stores/settings.svelte';
	import { CheckIcon, InfoIcon, TriangleAlert } from '@lucide/svelte';
	import * as Alert from '@repo/ui/alert';
	import { Badge } from '@repo/ui/badge';
	import { Button } from '@repo/ui/button';
	import * as Card from '@repo/ui/card';
	import { Checkbox } from '@repo/ui/checkbox';
	import * as Collapsible from '@repo/ui/collapsible';
	import { Input } from '@repo/ui/input';
	import { Link } from '@repo/ui/link';
	import * as Select from '@repo/ui/select';
	import { Separator } from '@repo/ui/separator';

	import {
		isUsingNativeBackendAtWrongSampleRate,
		isUsingWhisperCppWithBrowserBackend,
	} from '../../../+layout/check-ffmpeg';

	// Helper function to get human-readable language labels
	const getLanguageLabel = (langCode: SupportedLanguage): string => {
		const labels: Record<SupportedLanguage, string> = {
			af: 'Afrikaans',
			ar: 'Arabic',
			auto: 'Auto',
			az: 'Azerbaijani',
			be: 'Belarusian',
			bg: 'Bulgarian',
			bs: 'Bosnian',
			ca: 'Catalan',
			cs: 'Czech',
			cy: 'Welsh',
			da: 'Danish',
			de: 'German',
			el: 'Greek',
			en: 'English',
			es: 'Spanish',
			et: 'Estonian',
			fa: 'Persian',
			fi: 'Finnish',
			fr: 'French',
			gl: 'Galician',
			he: 'Hebrew',
			hi: 'Hindi',
			hr: 'Croatian',
			hu: 'Hungarian',
			hy: 'Armenian',
			id: 'Indonesian',
			is: 'Icelandic',
			it: 'Italian',
			ja: 'Japanese',
			kk: 'Kazakh',
			kn: 'Kannada',
			ko: 'Korean',
			lt: 'Lithuanian',
			lv: 'Latvian',
			mi: 'Maori',
			mk: 'Macedonian',
			mr: 'Marathi',
			ms: 'Malay',
			ne: 'Nepali',
			nl: 'Dutch',
			no: 'Norwegian',
			pl: 'Polish',
			pt: 'Portuguese',
			ro: 'Romanian',
			ru: 'Russian',
			sk: 'Slovak',
			sl: 'Slovenian',
			sr: 'Serbian',
			sv: 'Swedish',
			sw: 'Swahili',
			ta: 'Tamil',
			th: 'Thai',
			tl: 'Tagalog',
			tr: 'Turkish',
			uk: 'Ukrainian',
			ur: 'Urdu',
			vi: 'Vietnamese',
			zh: 'Chinese',
		};
		return labels[langCode] || langCode;
	};
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
			settings.updateKey(
				'transcription.selectedTranscriptionService',
				selected,
			);
		}}
		placeholder="Select a transcription service"
	/>

	{#if settings.value['transcription.selectedTranscriptionService'] === 'OpenAI'}
		<LabeledSelect
			id="openai-model"
			label="OpenAI Model"
			items={OPENAI_TRANSCRIPTION_MODELS.map((model) => ({
				label: model.name,
				value: model.name,
				...model,
			}))}
			selected={settings.value['transcription.openai.model']}
			onSelectedChange={(selected) => {
				settings.updateKey('transcription.openai.model', selected);
			}}
			renderOption={renderModelOption}
		>
			{#snippet description()}
				You can find more details about the models in the <Button
					variant="link"
					class="px-0.3 py-0.2 h-fit"
					href="https://platform.openai.com/docs/guides/speech-to-text"
					target="_blank"
					rel="noopener noreferrer"
				>
					OpenAI docs
				</Button>.
			{/snippet}
		</LabeledSelect>
		<OpenAiApiKeyInput />
	{:else if settings.value['transcription.selectedTranscriptionService'] === 'Groq'}
		<LabeledSelect
			id="groq-model"
			label="Groq Model"
			items={GROQ_MODELS.map((model) => ({
				label: model.name,
				value: model.name,
				...model,
			}))}
			selected={settings.value['transcription.groq.model']}
			onSelectedChange={(selected) => {
				settings.updateKey('transcription.groq.model', selected);
			}}
			renderOption={renderModelOption}
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
	{:else if settings.value['transcription.selectedTranscriptionService'] === 'Deepgram'}
		<LabeledSelect
			id="deepgram-model"
			label="Deepgram Model"
			items={DEEPGRAM_TRANSCRIPTION_MODELS.map((model) => ({
				label: model.name,
				value: model.name,
				...model,
			}))}
			selected={settings.value['transcription.deepgram.model']}
			onSelectedChange={(selected) => {
				settings.updateKey('transcription.deepgram.model', selected);
			}}
			renderOption={renderModelOption}
		/>
		<DeepgramApiKeyInput />
	{:else if settings.value['transcription.selectedTranscriptionService'] === 'ElevenLabs'}
		<LabeledSelect
			id="elevenlabs-model"
			label="ElevenLabs Model"
			items={ELEVENLABS_TRANSCRIPTION_MODELS.map((model) => ({
				label: model.name,
				value: model.name,
				...model,
			}))}
			selected={settings.value['transcription.elevenlabs.model']}
			onSelectedChange={(selected) => {
				settings.updateKey('transcription.elevenlabs.model', selected);
			}}
			renderOption={renderModelOption}
		>
			{#snippet description()}
				You can find more details about the models in the <Button
					variant="link"
					class="px-0.3 py-0.2 h-fit"
					href="https://elevenlabs.io/docs/capabilities/speech-to-text"
					target="_blank"
					rel="noopener noreferrer"
				>
					ElevenLabs docs
				</Button>.
			{/snippet}
		</LabeledSelect>
		<ElevenLabsApiKeyInput />
	{:else if settings.value['transcription.selectedTranscriptionService'] === 'speaches'}
		<div class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Speaches Setup</Card.Title>
					<Card.Description>
						Install Speaches server and configure Whispering. Speaches is the
						successor to faster-whisper-server with improved features and active
						development.
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
								<span class="text-muted-foreground">Step 1:</span> Install Speaches
								server
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
									Choose CUDA, CUDA with CDI, or CPU variant depending on your
									system
								</li>
							</ul>
						</div>

						<div>
							<p class="text-sm font-medium mb-2">
								<span class="text-muted-foreground">Step 2:</span> Start Speaches
								container
							</p>
							<CopyablePre
								copyableText="docker compose up --detach"
								variant="code"
							/>
						</div>

						<div>
							<p class="text-sm font-medium">
								<span class="text-muted-foreground">Step 3:</span> Download a speech
								recognition model
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
									copyableText="uvx speaches-cli model download Systran/faster-distil-whisper-small.en"
									variant="code"
								/>
							</div>
						</div>

						<div>
							<p class="text-sm font-medium">
								<span class="text-muted-foreground">Step 4:</span> Configure the
								settings below
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
				settings.updateKey('transcription.speaches.baseUrl', value);
			}}
		>
			{#snippet description()}
				<p class="text-muted-foreground text-sm">
					The URL where your Speaches server is running (<code>
						SPEACHES_BASE_URL
					</code>), typically
					<CopyToClipboardButton
						contentDescription="speaches base url"
						textToCopy="http://localhost:8000"
						class="bg-muted rounded px-[0.3rem] py-[0.15rem] font-mono text-sm hover:bg-muted/80"
						variant="ghost"
						size="sm"
					>
						http://localhost:8000
						{#snippet copiedContent()}
							http://localhost:8000
							<CheckIcon class="size-4" />
						{/snippet}
					</CopyToClipboardButton>
				</p>
			{/snippet}
		</LabeledInput>

		<LabeledInput
			id="speaches-model-id"
			label="Model ID"
			placeholder="Systran/faster-distil-whisper-small.en"
			value={settings.value['transcription.speaches.modelId']}
			oninput={({ currentTarget: { value } }) => {
				settings.updateKey('transcription.speaches.modelId', value);
			}}
		>
			{#snippet description()}
				<p class="text-muted-foreground text-sm">
					The model you downloaded in step 3 (<code>MODEL_ID</code>), e.g.
					<CopyToClipboardButton
						contentDescription="speaches model id"
						textToCopy="Systran/faster-distil-whisper-small.en"
						class="bg-muted rounded px-[0.3rem] py-[0.15rem] font-mono text-sm hover:bg-muted/80"
						variant="ghost"
						size="sm"
					>
						Systran/faster-distil-whisper-small.en
						{#snippet copiedContent()}
							Systran/faster-distil-whisper-small.en
							<CheckIcon class="size-4" />
						{/snippet}
					</CopyToClipboardButton>
				</p>
			{/snippet}
		</LabeledInput>
	{:else if settings.value['transcription.selectedTranscriptionService'] === 'whispercpp'}
		<div class="space-y-4">
			<!-- Whisper Model Selector Component -->
			{#if window.__TAURI_INTERNALS__}
				<WhisperModelSelector />
			{/if}

			{#if isUsingWhisperCppWithBrowserBackend()}
				<Alert.Root class="border-amber-500/20 bg-amber-500/5">
					<InfoIcon class="size-4 text-amber-600 dark:text-amber-400" />
					<Alert.Title class="text-amber-600 dark:text-amber-400">
						FFmpeg Required
					</Alert.Title>
					<Alert.Description>
						Whisper C++ requires FFmpeg to convert audio to 16kHz WAV format
						when using browser recording.
						<Link
							href="/install-ffmpeg"
							class="font-medium underline underline-offset-4 hover:text-amber-700 dark:hover:text-amber-300"
						>
							Install FFmpeg →
						</Link>
					</Alert.Description>
				</Alert.Root>
			{:else if isUsingNativeBackendAtWrongSampleRate()}
				<Alert.Root class="border-amber-500/20 bg-amber-500/5">
					<InfoIcon class="size-4 text-amber-600 dark:text-amber-400" />
					<Alert.Title class="text-amber-600 dark:text-amber-400">
						FFmpeg Required
					</Alert.Title>
					<Alert.Description>
						Whisper C++ requires 16kHz audio. FFmpeg is needed to convert from
						your current {settings.value['recording.desktop.sampleRate']}Hz
						sample rate.
						<Link
							href="/install-ffmpeg"
							class="font-medium underline underline-offset-4 hover:text-amber-700 dark:hover:text-amber-300"
						>
							Install FFmpeg →
						</Link>
					</Alert.Description>
				</Alert.Root>
			{/if}
		</div>

		<div class="flex items-center space-x-2">
			<Checkbox
				id="whispercpp-use-gpu"
				checked={settings.value['transcription.whispercpp.useGpu']}
				onCheckedChange={(checked) => {
					settings.updateKey('transcription.whispercpp.useGpu', checked);
				}}
			/>
			<label for="whispercpp-use-gpu" class="text-sm font-medium">
				Use GPU acceleration (if available)
			</label>
		</div>
	{/if}

	<LabeledSelect
		id="output-language"
		label="Output Language"
		items={SUPPORTED_LANGUAGES_OPTIONS}
		selected={settings.value['transcription.outputLanguage']}
		onSelectedChange={(selected) => {
			settings.updateKey('transcription.outputLanguage', selected);
		}}
		placeholder="Select a language"
	/>

	<!-- Favorite Languages Configuration -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Language Toggle Shortcuts</Card.Title>
			<Card.Description>
				Configure up to 3 favorite languages for quick switching via keyboard shortcuts
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if (settings.value['transcription.favoriteLanguages'] ?? ['en', 'ja', 'zh']).length > 0}
				{#each (settings.value['transcription.favoriteLanguages'] ?? ['en', 'ja', 'zh']) as language, i}
					{@const slotNumber = i + 1}
					<div class="flex items-center justify-between p-3 border rounded-lg">
						<div class="flex items-center gap-3">
							<Badge variant="outline" class="font-mono text-xs">
								Slot {slotNumber}
							</Badge>
							<div>
								<p class="font-medium text-sm">
									{getLanguageLabel(language)}
								</p>
								<p class="text-muted-foreground text-xs">
									Language code: {language}
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							disabled
						>
							Remove (coming soon)
						</Button>
					</div>
				{/each}
			{/if}

			{#if (settings.value['transcription.favoriteLanguages'] ?? ['en', 'ja', 'zh']).length < 3}
				<div class="text-muted-foreground text-sm p-3 border rounded-lg border-dashed">
					💡 Tip: You can add more favorite languages by editing the settings manually
				</div>
			{/if}

			<div class="flex items-center justify-between">
				<div class="text-muted-foreground text-xs space-y-1">
					<p><strong>Keyboard shortcuts:</strong></p>
					<ul class="list-disc list-inside space-y-0.5 ml-2">
						<li>Toggle between languages: Configure in Settings → Shortcuts</li>
						<li>Jump to Slot 1/2/3: Configure in Settings → Shortcuts</li>
					</ul>
				</div>
				<Button
					variant="outline" 
					size="sm"
					onclick={() => {
						settings.updateKey('transcription.favoriteLanguages', ['en', 'ja', 'zh']);
					}}
				>
					Reset to defaults
				</Button>
			</div>
		</Card.Content>
	</Card.Root>

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
			settings.updateKey('transcription.temperature', value);
		}}
		description="Controls randomness in the model's output. 0 is focused and deterministic, 1 is more creative."
	/>

	<LabeledTextarea
		id="transcription-prompt"
		label="System Prompt"
		placeholder="e.g., This is an academic lecture about quantum physics with technical terms like 'eigenvalue' and 'Schrödinger'"
		value={settings.value['transcription.prompt']}
		oninput={({ currentTarget: { value } }) => {
			settings.updateKey('transcription.prompt', value);
		}}
		description="Helps transcription service (e.g., Whisper) better recognize specific terms, names, or context during initial transcription. Not for text transformations - use the Transformations tab for post-processing rules."
	/>
</div>

{#snippet renderModelOption({
	item,
}: {
	item: {
		cost: string;
		description: string;
		name: string;
	};
})}
	<div class="flex flex-col gap-1 py-1">
		<div class="font-medium">{item.name}</div>
		<div class="text-sm text-muted-foreground">
			{item.description}
		</div>
		<Badge variant="outline" class="text-xs">{item.cost}</Badge>
	</div>
{/snippet}
