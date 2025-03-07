<script lang="ts">
	import { LabeledInput } from '$lib/components/labeled/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { getCommandsFromContext } from '$lib/query/singletons/commands';
	import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
	import { settings } from '$lib/stores/settings.svelte';
	import { commands } from '@repo/shared/settings';

	const commandCallbacks = getCommandsFromContext();
	const shortcutsRegister = getShortcutsRegisterFromContext();
</script>

<svelte:head>
	<title>Configure Shortcuts - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Shortcuts</h3>
		<p class="text-muted-foreground text-sm">
			Configure your shortcuts for activating Whispering.
		</p>
	</div>
	<Separator />

	{#each commands as command}
		<LabeledInput
			id="local-shortcut-{command.id}"
			label="Local Shortcut for {command.description}"
			placeholder="Local Shortcut for {command.description}"
			value={settings.value[`shortcuts.local.${command.id}`]}
			onchange={({ currentTarget: { value } }) => {
				settings.value = {
					...settings.value,
					[`shortcuts.local.${command.id}`]: value,
				};
				shortcutsRegister.registerLocalShortcut({
					shortcut: value,
					callback: () => commandCallbacks[command.id],
				});
			}}
		/>
	{/each}

	{#if window.__TAURI_INTERNALS__}
		<LabeledInput
			id="global-shortcut"
			label="Global Shortcut"
			placeholder="Global Shortcut to toggle recording"
			value={settings.value['shortcuts.global.toggleManualRecording']}
			onchange={({ currentTarget: { value } }) => {
				settings.value = {
					...settings.value,
					'shortcuts.global.toggleManualRecording': value,
				};
				shortcutsRegister.registerGlobalShortcut({
					shortcut: value,
					callback: () => commands.toggleManualRecording(),
				});
			}}
		/>
	{:else}
		<Label class="text-sm" for="global-shortcut">Global Shortcut</Label>
		<div class="relative">
			<Input
				id="global-shortcut"
				placeholder="Global Shortcut to toggle recording"
				value={settings.value['shortcuts.global.toggleManualRecording']}
				type="text"
				autocomplete="off"
				disabled
			/>
			<Button
				class="absolute inset-0 backdrop-blur"
				href="/global-shortcut"
				variant="link"
			>
				Enable Global Shortcut
			</Button>
		</div>
	{/if}
</div>
