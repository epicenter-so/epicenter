<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import {
		CheckIcon,
		Download,
		LoaderCircle,
		Paperclip,
		X,
	} from '@lucide/svelte';
	import { Badge } from '@repo/ui/badge';
	import { Button } from '@repo/ui/button';
	import * as Card from '@repo/ui/card';
	import { Input } from '@repo/ui/input';
	import { Link } from '@repo/ui/link';
	import * as Tabs from '@repo/ui/tabs';
	import { createQuery } from '@tanstack/svelte-query';
	import { appDataDir } from '@tauri-apps/api/path';
	import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
	import { fetch } from '@tauri-apps/plugin-http';
	import { toast } from 'svelte-sonner';
	import { SvelteSet } from 'svelte/reactivity';
	import { extractErrorMessage } from 'wellcrafted/error';

	// Pre-built models configuration
	const WHISPER_MODELS = [
		{
			description: 'Fastest, basic accuracy',
			filename: 'ggml-tiny.bin',
			id: 'tiny',
			name: 'Tiny',
			size: '78 MB',
			sizeBytes: 77_700_000,
			url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
		},
		{
			description: 'Fast, good accuracy',
			filename: 'ggml-small.bin',
			id: 'small',
			name: 'Small',
			size: '488 MB',
			sizeBytes: 488_000_000,
			url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
		},
		{
			description: 'Balanced speed & accuracy',
			filename: 'ggml-medium.bin',
			id: 'medium',
			name: 'Medium',
			size: '1.5 GB',
			sizeBytes: 1_530_000_000,
			url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
		},
		{
			description: 'Best accuracy, slower',
			filename: 'ggml-large-v3-turbo.bin',
			id: 'large-v3-turbo',
			name: 'Large v3 Turbo',
			size: '1.6 GB',
			sizeBytes: 1_620_000_000,
			url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin',
		},
	];

	// Component state
	let downloadProgress = $state<{ [key: string]: number }>({});
	let downloadingModels = new SvelteSet<string>();

	// Helper functions
	async function getModelsDirectory(): Promise<string> {
		const appDir = await appDataDir();
		return `${appDir}whisper-models`;
	}

	async function ensureModelsDirectory(): Promise<void> {
		const modelsDir = await getModelsDirectory();
		const dirExists = await exists(modelsDir);
		if (!dirExists) {
			await mkdir(modelsDir, { recursive: true });
		}
	}

	async function getModelPath(filename: string): Promise<string> {
		const modelsDir = await getModelsDirectory();
		return `${modelsDir}/${filename}`;
	}

	// Query to check which models are downloaded
	const downloadedModelsQuery = createQuery(() => ({
		enabled: !!window.__TAURI_INTERNALS__,
		queryFn: async () => {
			if (!window.__TAURI_INTERNALS__) return [];

			const downloaded: string[] = [];
			for (const model of WHISPER_MODELS) {
				const modelPath = await getModelPath(model.filename);
				if (await exists(modelPath)) {
					downloaded.push(model.id);
				}
			}
			return downloaded;
		},
		queryKey: ['whisperModels', 'downloaded'],
		staleTime: 5000,
	}));

	const downloadedModels = $derived(new Set(downloadedModelsQuery.data || []));

	// Download model function
	async function downloadModel(modelId: string) {
		const model = WHISPER_MODELS.find((m) => m.id === modelId);
		if (!model || downloadingModels.has(modelId)) return;

		downloadingModels.add(modelId);
		downloadProgress[modelId] = 0;

		try {
			await ensureModelsDirectory();
			const modelPath = await getModelPath(model.filename);

			// Check if already exists
			if (await exists(modelPath)) {
				settings.updateKey('transcription.whispercpp.modelPath', modelPath);
				toast.success('Model already downloaded and activated');
				await downloadedModelsQuery.refetch();
				return;
			}

			// Download the model
			const response = await fetch(model.url);
			if (!response.ok) {
				throw new Error(`Failed to download: ${response.status}`);
			}

			const contentLength = response.headers.get('content-length');
			const totalBytes = contentLength
				? Number.parseInt(contentLength, 10)
				: model.sizeBytes;

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error('Failed to read response body');
			}

			const chunks: Uint8Array[] = [];
			let downloadedBytes = 0;

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				chunks.push(value);
				downloadedBytes += value.length;
				downloadProgress[modelId] = Math.round(
					(downloadedBytes / totalBytes) * 100,
				);
			}

			// Combine chunks and save
			const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
			const fileContent = new Uint8Array(totalLength);
			let position = 0;
			for (const chunk of chunks) {
				fileContent.set(chunk, position);
				position += chunk.length;
			}

			await writeFile(modelPath, fileContent);

			// Update settings and refresh
			settings.updateKey('transcription.whispercpp.modelPath', modelPath);
			toast.success('Model downloaded and activated successfully');
			await downloadedModelsQuery.refetch();
		} catch (error) {
			console.error('Download failed:', error);
			toast.error('Failed to download model', {
				description: extractErrorMessage(error),
			});
		} finally {
			downloadingModels.delete(modelId);
			delete downloadProgress[modelId];
		}
	}

	// Activate an already downloaded model
	async function activateModel(modelId: string) {
		const model = WHISPER_MODELS.find((m) => m.id === modelId);
		if (!model) return;

		const modelPath = await getModelPath(model.filename);
		settings.updateKey('transcription.whispercpp.modelPath', modelPath);
		toast.success(`${model.name} model activated`);
		downloadedModelsQuery.refetch();
	}

	// Handle manual file selection
	async function selectManualModel() {
		if (!window.__TAURI_INTERNALS__) return;

		const { open } = await import('@tauri-apps/plugin-dialog');
		const selected = await open({
			title: 'Select Whisper Model File',
			filters: [
				{
					extensions: ['bin', 'gguf', 'ggml'],
					name: 'Whisper Models',
				},
			],
			multiple: false,
		});

		if (selected) {
			settings.updateKey('transcription.whispercpp.modelPath', selected);
			toast.success('Model selected');
			await modelFileQuery.refetch();
		}
	}

	// Get current active model - properly reactive to settings changes
	const activeModelId = $derived.by(() => {
		const currentModelPath =
			settings.value['transcription.whispercpp.modelPath'];
		if (!currentModelPath) return null;

		for (const model of WHISPER_MODELS) {
			if (currentModelPath.endsWith(model.filename)) {
				return model.id;
			}
		}
		return 'custom';
	});

	// Query to check if the manual model file exists
	const modelFileQuery = createQuery(() => ({
		enabled:
			!!settings.value['transcription.whispercpp.modelPath'] &&
			!!window.__TAURI_INTERNALS__,
		queryFn: async () => {
			const modelPath = settings.value['transcription.whispercpp.modelPath'];
			if (!modelPath || !window.__TAURI_INTERNALS__) return null;
			return await exists(modelPath);
		},
		queryKey: [
			'modelFileExists',
			settings.value['transcription.whispercpp.modelPath'],
		],
		staleTime: 5000,
	}));
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Whisper Model</Card.Title>
		<Card.Description>
			Select a pre-built model or browse for your own. Models run locally for
			private, offline transcription.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<Tabs.Root value="prebuilt">
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger value="prebuilt">Pre-built Models</Tabs.Trigger>
				<Tabs.Trigger value="manual">Manual Selection</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="prebuilt" class="space-y-4">
				<div class="grid gap-3">
					{#each WHISPER_MODELS as model}
						{@const isActive = activeModelId === model.id}
						{@const isDownloaded = downloadedModels.has(model.id)}
						{@const isDownloading = downloadingModels.has(model.id)}
						{@const progress = downloadProgress[model.id] || 0}

						<div
							class="flex items-center gap-3 p-3 rounded-lg border {isActive
								? 'border-primary bg-primary/5'
								: ''}"
						>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<span class="font-medium">{model.name}</span>
									{#if isActive}
										<Badge variant="default" class="text-xs">Active</Badge>
									{:else if isDownloaded}
										<Badge variant="secondary" class="text-xs">Downloaded</Badge
										>
									{/if}
								</div>
								<div class="text-sm text-muted-foreground">
									{model.description}
								</div>
								<div class="text-xs text-muted-foreground mt-1">
									{model.size}
								</div>
							</div>

							<div class="flex items-center gap-2">
								{#if isDownloading}
									<div class="flex items-center gap-2 min-w-[120px]">
										<LoaderCircle class="size-4 animate-spin" />
										<span class="text-sm font-medium">{progress}%</span>
									</div>
								{:else if isDownloaded}
									{#if !isActive}
										<Button
											size="sm"
											variant="outline"
											onclick={() => activateModel(model.id)}
										>
											Activate
										</Button>
									{:else}
										<Button size="sm" variant="default" disabled>
											<CheckIcon class="size-4 mr-1" />
											Activated
										</Button>
									{/if}
								{:else}
									<Button
										size="sm"
										variant="outline"
										onclick={() => downloadModel(model.id)}
									>
										<Download class="size-4 mr-2" />
										Download
									</Button>
								{/if}
							</div>
						</div>

						{#if isDownloading}
							<div class="w-full bg-secondary rounded-full h-1.5 -mt-2">
								<div
									class="bg-primary h-1.5 rounded-full transition-all duration-300"
									style="width: {progress}%"
								></div>
							</div>
						{/if}
					{/each}
				</div>
			</Tabs.Content>

			<Tabs.Content value="manual" class="space-y-4">
				<div class="space-y-4">
					<!-- Instructions -->
					<div>
						<p class="text-sm font-medium mb-2">
							<span class="text-muted-foreground">Step 1:</span> Download a Whisper
							model
						</p>
						<ul class="ml-6 mt-2 space-y-2 text-sm text-muted-foreground">
							<li class="list-disc">
								Visit the <Link
									href="https://huggingface.co/ggerganov/whisper.cpp/tree/main"
									target="_blank"
									rel="noopener noreferrer"
									class="underline"
								>
									model repository
								</Link>
							</li>
							<li class="list-disc">
								Download any model file (e.g., ggml-base.en.bin for
								English-only)
							</li>
							<li class="list-disc">
								Quantized models (q5_0, q8_0) offer smaller sizes with minimal
								quality loss
							</li>
						</ul>
					</div>

					<!-- Step 2: Select model -->
					<div>
						<p class="text-sm font-medium mb-2">
							<span class="text-muted-foreground">Step 2:</span> Select the model
							file
						</p>
						<div class="flex items-center gap-2">
							<Input
								id="whispercpp-model-path"
								type="text"
								value={settings.value['transcription.whispercpp.modelPath'] ||
									''}
								readonly
								placeholder="No model selected"
								class="flex-1"
							/>
							{#if settings.value['transcription.whispercpp.modelPath']}
								<Button
									variant="outline"
									size="icon"
									onclick={() => {
										settings.updateKey(
											'transcription.whispercpp.modelPath',
											'',
										);
										toast.success('Model path cleared');
									}}
									title="Clear model path"
								>
									<X class="size-4" />
								</Button>
							{/if}
							<Button
								variant="outline"
								size="icon"
								onclick={selectManualModel}
								title="Browse for model file"
							>
								<Paperclip class="size-4" />
							</Button>
						</div>
						{#if settings.value['transcription.whispercpp.modelPath']}
							{#if modelFileQuery.isPending}
								<p class="text-xs text-muted-foreground mt-1">
									Checking model file...
								</p>
							{:else if modelFileQuery.data === false}
								<p class="text-xs text-destructive mt-1">
									⚠️ Model file not found: {settings.value[
										'transcription.whispercpp.modelPath'
									]
										.split('/')
										.pop()}
								</p>
							{:else if modelFileQuery.data === true}
								<p class="text-xs text-green-600 dark:text-green-400 mt-1">
									✓ Model: {settings.value['transcription.whispercpp.modelPath']
										.split('/')
										.pop()}
								</p>
							{:else}
								<p class="text-xs text-muted-foreground mt-1">
									Model: {settings.value['transcription.whispercpp.modelPath']
										.split('/')
										.pop()}
								</p>
							{/if}
						{/if}
					</div>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</Card.Content>
</Card.Root>
