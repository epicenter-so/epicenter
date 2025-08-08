<script lang="ts">
	import {  LabeledSlider, LabeledSwitch } from '$lib/components/labeled';
	import { Separator } from '@repo/ui/separator';
	import { Button } from '@repo/ui/button';
	import { PlayIcon, UploadIcon, XIcon } from 'lucide-svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { type WhisperingSoundNames } from '$lib/constants/sounds';
	import { rpc } from '$lib/query';
	import { FileDropZone, ACCEPT_AUDIO, MEGABYTE } from '@repo/ui/file-drop-zone';

	// Sound events configuration
	const soundEvents = [
		{ key: 'manual-start', label: 'Manual Recording Start', description: 'When you start recording manually' },
		{ key: 'manual-stop', label: 'Manual Recording Stop', description: 'When you stop recording manually' },
		{ key: 'manual-cancel', label: 'Manual Recording Cancel', description: 'When you cancel recording manually' },
		{ key: 'vad-start', label: 'VAD Session Start', description: 'When voice activity detection session begins' },
		{ key: 'vad-capture', label: 'VAD Capture', description: 'When voice activity is detected and captured' },
		{ key: 'vad-stop', label: 'VAD Session Stop', description: 'When voice activity detection session ends' },
		{ key: 'transcriptionComplete', label: 'Transcription Complete', description: 'When audio transcription finishes' },
		{ key: 'transformationComplete', label: 'Transformation Complete', description: 'When text transformation finishes' },
	] as const;

	const testSound = (soundKey: string) => {
		rpc.sound.playSoundIfEnabled.execute(soundKey as WhisperingSoundNames);
	};

	const applyGlobalVolume = (volume: number) => {
		const volumeDecimal = volume / 100;
		const updates: Partial<typeof settings.value> = {};
		
		soundEvents.forEach(event => {
			updates[`sound.volume.${event.key}` as keyof typeof settings.value] = volumeDecimal as any;
		});
		
		settings.value = { ...settings.value, ...updates };
	};

	const handleCustomSoundUpload = async (files: File[], soundKey: string) => {
		const file = files[0]; // Take only the first file
		if (!file) return;

		// Create a blob URL for the uploaded file
		const blobUrl = URL.createObjectURL(file);
		
		// Update the custom sound setting
		settings.value = { 
			...settings.value, 
			[`sound.custom.${soundKey}`]: blobUrl 
		};

		// Show success notification
		rpc.notify.success.execute({
			title: 'Custom sound uploaded',
			description: `Custom sound for ${soundEvents.find(e => e.key === soundKey)?.label} has been updated.`
		});
	};

	const removeCustomSound = (soundKey: string) => {
		// Clear the custom sound setting
		settings.value = { 
			...settings.value, 
			[`sound.custom.${soundKey}`]: '' 
		};

		// Show success notification
		rpc.notify.success.execute({
			title: 'Custom sound removed',
			description: `Reverted to default sound for ${soundEvents.find(e => e.key === soundKey)?.label}.`
		});
	};
</script>

<svelte:head>
	<title>Sound Settings - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Sound Settings</h3>
		<p class="text-muted-foreground text-sm">
			Configure notification sounds and volumes.
		</p>
	</div>

	<Separator />

	<!-- Global Volume Control -->
	<div class="space-y-4">
		<h4 class="text-base font-medium">Global Controls</h4>
		<div class="flex items-end gap-4">
			<LabeledSlider
				id="sound.volume.global"
				label="Set All Volumes"
				value={Math.round(settings.value['sound.volume'] * 100)}
				min={0}
				max={100}
				step={5}
				description="Quickly set the same volume for all notification sounds"
				onValueChange={(v) => {
					settings.value = { ...settings.value, 'sound.volume': v / 100 };
					applyGlobalVolume(v);
				}}
			/>
			<Button variant="outline" size="sm" onclick={() => testSound('transcriptionComplete')}>
				<PlayIcon class="mr-2 size-4" />
				Test
			</Button>
		</div>
	</div>

	<Separator />

	<!-- Individual Sound Controls -->
	<div class="space-y-4">
		<h4 class="text-base font-medium">Individual Sound Controls</h4>
		{#each soundEvents as event}
			<div class="border rounded-lg p-4 space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<h5 class="font-medium">{event.label}</h5>
						<p class="text-sm text-muted-foreground">{event.description}</p>
					</div>
					<div class="flex items-center gap-2">
						<Button 
							variant="outline" 
							size="sm" 
							onclick={() => testSound(event.key)}
							disabled={!settings.value[`sound.playOn.${event.key}` as keyof typeof settings.value]}
						>
							<PlayIcon class="mr-2 size-4" />
							Test
						</Button>
						<LabeledSwitch
							id="sound.playOn.{event.key}"
							label=""
							checked={settings.value[`sound.playOn.${event.key}` as keyof typeof settings.value] as boolean}
							onCheckedChange={(v) => {
								settings.value = { ...settings.value, [`sound.playOn.${event.key}`]: v };
							}}
						/>
					</div>
				</div>
				
				<LabeledSlider
					id="sound.volume.{event.key}"
					label="Volume"
					value={Math.round((settings.value[`sound.volume.${event.key}` as keyof typeof settings.value] as number) * 100)}
					min={0}
					max={100}
					step={5}
					onValueChange={(v) => {
						settings.value = { ...settings.value, [`sound.volume.${event.key}`]: v / 100 };
					}}
				/>

				<!-- Custom Sound Upload Section -->
				<div class="space-y-2">
					<h6 class="text-sm font-medium">Custom Sound</h6>
					{#if settings.value[`sound.custom.${event.key}` as keyof typeof settings.value]}
						<div class="flex items-center gap-2 p-2 bg-muted rounded">
							<span class="text-sm flex-1">Custom sound uploaded</span>
							<Button 
								variant="outline" 
								size="sm"
								onclick={() => removeCustomSound(event.key)}
							>
								<XIcon class="mr-1 size-3" />
								Remove
							</Button>
						</div>
					{:else}
						<FileDropZone
							accept={ACCEPT_AUDIO}
							maxFiles={1}
							maxFileSize={5 * MEGABYTE}
							onUpload={(files) => handleCustomSoundUpload(files, event.key)}
							class="h-20"
						>
							<div class="flex flex-col items-center gap-1">
								<UploadIcon class="size-4 text-muted-foreground" />
								<span class="text-xs text-muted-foreground">
									Drop audio file or click to browse
								</span>
							</div>
						</FileDropZone>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
