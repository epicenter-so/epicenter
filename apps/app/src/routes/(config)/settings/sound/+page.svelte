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
		id="sound.playOn.manual-start"
		label="Play sound when starting manual recording"
		checked={settings.value['sound.playOn.manual-start']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.manual-start': v };
		}}
	/>

	<LabeledSwitch
		id="sound.playOn.manual-start"
		label="Play sound when stopping manual recording"
		checked={settings.value['sound.playOn.manual-stop']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.manual-stop': v };
		}}
	/>

	<LabeledSwitch
		id="sound.playOn.manual-start"
		label="Play sound when canceling manual recording"
		checked={settings.value['sound.playOn.manual-cancel']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.manual-cancel': v };
		}}
	/>

	<Separator />

	<LabeledSwitch
		id="sound.playOn.vad-start"
		label="Play sound when starting vad recording session"
		checked={settings.value['sound.playOn.vad-start']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.vad-start': v };
		}}
	/>

	<LabeledSwitch
		id="sound.playOn.vad-start"
		label="Play sound vad capture"
		checked={settings.value['sound.playOn.vad-capture']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.vad-capture': v };
		}}
	/>

	<LabeledSwitch
		id="sound.playOn.vad-start"
		label="Play sound when stopping vad recording session"
		checked={settings.value['sound.playOn.vad-stop']}
		onCheckedChange={(v) => {
			settings.value = { ...settings.value, 'sound.playOn.vad-stop': v };
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
