<script lang="ts">
	import { LabeledSwitch } from '$lib/components/labeled';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<svelte:head>
	<title>Sound Settings - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Sound</h3>
		<p class="text-muted-foreground text-sm">
			Configure your Whispering sound preferences.
		</p>
	</div>

	<Separator />

	<LabeledSwitch
		id="sound.playOn.start-manual"
		label="Play sound when starting manual recording"
		checked={settings.value['sound.playOn.start-manual']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.start-manual': v };
		}}
	/>

	<LabeledSwitch
		id="sound.playOn.start-manual"
		label="Play sound when stopping manual recording"
		checked={settings.value['sound.playOn.stop-manual']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.stop-manual': v };
		}}
	/>

	<LabeledSwitch
		id="sound.playOn.start-manual"
		label="Play sound when canceling manual recording"
		checked={settings.value['sound.playOn.cancel-manual']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.cancel-manual': v };
		}}
	/>

	<Separator />

	<LabeledSwitch
		id="sound.playOn.start-vad"
		label="Play sound when starting vad recording session"
		checked={settings.value['sound.playOn.start-vad']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.start-vad': v };
		}}
	/>

	<LabeledSwitch
		id="sound.playOn.start-vad"
		label="Play sound vad capture"
		checked={settings.value['sound.playOn.capture-vad']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.capture-vad': v };
		}}
	/>

	<LabeledSwitch
		id="sound.playOn.start-vad"
		label="Play sound when stopping vad recording session"
		checked={settings.value['sound.playOn.stop-vad']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.stop-vad': v };
		}}
	/>

	<Separator />

	<LabeledSwitch
		id="play-sound-transcription"
		label="Play sound after transcription"
		checked={settings.value['sound.playOn.transcriptionComplete']}
		onCheckedChange={(v) => {
			settings.value = {
				...settings.value,
				'sound.playOn.transcriptionComplete': v,
			};
		}}
	/>

	<LabeledSwitch
		id="play-sound-transformation"
		label="Play sound after transformation"
		checked={settings.value['sound.playOn.transformationComplete']}
		onCheckedChange={(v) => {
			settings.value = {
				...settings.value,
				'sound.playOn.transformationComplete': v,
			};
		}}
	/>
</div>
