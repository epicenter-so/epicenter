<script lang="ts">
	import {
		LabeledSelect,
		LabeledSwitch,
	} from '$lib/components/labeled/index.js';
	import { Button } from '@repo/ui/button';
	import { Separator } from '@repo/ui/separator';
	import { ALWAYS_ON_TOP_OPTIONS } from '$lib/constants/ui';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<svelte:head>
	<title>Settings - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">General</h3>
		<p class="text-muted-foreground text-sm">
			Configure your general Whispering preferences.
		</p>
	</div>

	<Separator />

	<LabeledSwitch
		id="transcription.clipboard.copyOnSuccess"
		label="Copy text to clipboard on successful transcription"
		checked={settings.value['transcription.clipboard.copyOnSuccess']}
		onCheckedChange={(v) => {
			settings.updateKey('transcription.clipboard.copyOnSuccess', v);
		}}
	/>

	<LabeledSwitch
		id="transcription.clipboard.pasteOnSuccess"
		label="Paste contents from clipboard after successful transcription"
		checked={settings.value['transcription.clipboard.pasteOnSuccess']}
		onCheckedChange={(v) => {
			settings.updateKey('transcription.clipboard.pasteOnSuccess', v);
		}}
		disabled={!settings.value['transcription.clipboard.copyOnSuccess']}
	/>

	<Separator />

	<LabeledSwitch
		id="transformation.clipboard.copyOnSuccess"
		label="Copy text to clipboard on successful transformation"
		checked={settings.value['transformation.clipboard.copyOnSuccess']}
		onCheckedChange={(v) => {
			settings.updateKey('transformation.clipboard.copyOnSuccess', v);
		}}
	/>

	<LabeledSwitch
		id="transformation.clipboard.pasteOnSuccess"
		label="Paste contents from clipboard after successful transformation"
		checked={settings.value['transformation.clipboard.pasteOnSuccess']}
		onCheckedChange={(v) => {
			settings.updateKey('transformation.clipboard.pasteOnSuccess', v);
		}}
		disabled={!settings.value['transformation.clipboard.copyOnSuccess']}
	/>

	<Separator />

	<LabeledSelect
		id="recording-retention-strategy"
		label="Auto Delete Recordings"
		items={[
			{ value: 'keep-forever', label: 'Keep All Recordings' },
			{ value: 'limit-count', label: 'Keep Limited Number' },
		] as const}
		selected={settings.value['database.recordingRetentionStrategy']}
		onSelectedChange={(selected) => {
			settings.updateKey('database.recordingRetentionStrategy', selected);
		}}
		placeholder="Select retention strategy"
	/>

	{#if settings.value['database.recordingRetentionStrategy'] === 'limit-count'}
		<LabeledSelect
			id="max-recording-count"
			label="Maximum Recordings"
			items={[
				{ value: '5', label: '5 Recordings' },
				{ value: '10', label: '10 Recordings' },
				{ value: '25', label: '25 Recordings' },
				{ value: '50', label: '50 Recordings' },
				{ value: '100', label: '100 Recordings' },
			]}
			selected={settings.value['database.maxRecordingCount']}
			onSelectedChange={(selected) => {
				settings.updateKey('database.maxRecordingCount', selected);
			}}
			placeholder="Select maximum recordings"
		/>
	{/if}

	{#if window.__TAURI_INTERNALS__}
		<LabeledSelect
			id="always-on-top"
			label="Always On Top"
			items={ALWAYS_ON_TOP_OPTIONS}
			selected={settings.value['system.alwaysOnTop']}
			onSelectedChange={async (selected) => {
				settings.updateKey('system.alwaysOnTop', selected);
			}}
			placeholder="Select a language"
		/>
	{/if}
</div>
