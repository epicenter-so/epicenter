<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { tryAsync, trySync } from '@epicenterhq/result';
	import { WhisperingErr } from '@repo/shared';
	import type { Command } from '@repo/shared/settings';
	import { commands } from '@repo/shared/settings';
	import hotkeys from 'hotkeys-js';
	import HotkeysJsFormatGuide from './HotkeysJsFormatGuide.svelte';
	import TauriGlobalShortcutFormatGuide from './TauriGlobalShortcutFormatGuide.svelte';

	const shortcutsRegister = getShortcutsRegisterFromContext();

	function registerLocalShortcut(command: Command, shortcutKey: string) {
		const currentCommandKey = settings.value[`shortcuts.local.${command.id}`];
		const unregisterOldCommandLocallyResult = trySync({
			try: () => hotkeys.unbind(currentCommandKey),
			mapErr: (error) =>
				WhisperingErr({
					title: `Error unregistering old command with id ${command.id} locally`,
					description: 'Please try again.',
					action: { type: 'more-details', error },
				}),
		});

		if (!unregisterOldCommandLocallyResult.ok) {
			toast.error(unregisterOldCommandLocallyResult.error);
		}

		shortcutsRegister.registerCommandLocally({
			command,
			shortcutKey,
			onSuccess: () => {
				settings.value = {
					...settings.value,
					[`shortcuts.local.${command.id}`]: shortcutKey,
				};
				toast.success({
					title: `Local shortcut set to ${shortcutKey}`,
					description: `Press the shortcut to ${command.description}`,
				});
			},
			onError: (error) => {
				toast.error(error);
			},
		});
	}

	async function registerGlobalShortcut(command: Command, shortcutKey: string) {
		const oldShortcutKey = settings.value[`shortcuts.global.${command.id}`];
		const unregisterOldShortcutKeyResult = await tryAsync({
			try: async () => {
				if (!window.__TAURI_INTERNALS__) return;
				const { unregister } = await import(
					'@tauri-apps/plugin-global-shortcut'
				);
				return await unregister(oldShortcutKey);
			},
			mapErr: (error) =>
				WhisperingErr({
					title: `Error unregistering command with id ${command.id} globally`,
					description: 'Please try again.',
					action: { type: 'more-details', error },
				}),
		});

		if (!unregisterOldShortcutKeyResult.ok) {
			toast.error(unregisterOldShortcutKeyResult.error);
		}

		shortcutsRegister.registerCommandGlobally({
			command,
			shortcutKey,
			onSuccess: () => {
				settings.value = {
					...settings.value,
					[`shortcuts.global.${command.id}`]: shortcutKey,
				};
				toast.success({
					title: `Global shortcut set to ${shortcutKey}`,
					description: `Press the shortcut to ${command.description}`,
				});
			},
			onError: (error) => {
				toast.error(error);
			},
		});
	}
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

	<Tabs.Root value="local" class="w-full">
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="local">Local Shortcuts</Tabs.Trigger>
			<Tabs.Trigger value="global">Global Shortcuts</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="local" class="space-y-4 mt-4">
			<HotkeysJsFormatGuide></HotkeysJsFormatGuide>
			{#each commands as command}
				<Card.Root>
					<Card.Header class="pb-2">
						<Card.Title class="text-base">{command.description}</Card.Title>
						<Card.Description>
							Set a keyboard shortcut that works when the app is in focus
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="flex gap-2 items-center">
							<Input
								id="local-shortcut-{command.id}"
								placeholder={`e.g. ${command.defaultLocalShortcut}`}
								value={settings.value[`shortcuts.local.${command.id}`]}
								oninput={({ currentTarget: { value } }) =>
									registerLocalShortcut(command, value)}
								autocomplete="off"
								class="flex-1"
							/>
							{#if settings.value[`shortcuts.local.${command.id}`]}
								<Badge variant="status.completed">Active</Badge>
							{:else}
								<Badge variant="outline">Not Set</Badge>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</Tabs.Content>

		<Tabs.Content value="global" class="space-y-4 mt-4">
			{#if window.__TAURI_INTERNALS__}
				<TauriGlobalShortcutFormatGuide></TauriGlobalShortcutFormatGuide>
				{#each commands as command}
					<Card.Root>
						<Card.Header class="pb-2">
							<Card.Title class="text-base">{command.description}</Card.Title>
							<Card.Description>
								Set a system-wide keyboard shortcut that works even when the app
								is not in focus
							</Card.Description>
						</Card.Header>
						<Card.Content>
							<div class="flex gap-2 items-center">
								<Input
									id="global-shortcut-{command.id}"
									placeholder="e.g. CommandOrControl+Shift+P"
									value={settings.value[`shortcuts.global.${command.id}`]}
									oninput={({ currentTarget: { value } }) =>
										registerGlobalShortcut(command, value)}
									autocomplete="off"
									class="flex-1"
								/>
								{#if settings.value[`shortcuts.global.${command.id}`]}
									<Badge variant="status.completed">Active</Badge>
								{:else}
									<Badge variant="outline">Not Set</Badge>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			{:else}
				<div class="relative">
					<div class="space-y-4 opacity-50">
						{#each commands as command}
							<Card.Root>
								<Card.Header class="pb-2">
									<Card.Title class="text-base">
										{command.description}
									</Card.Title>
									<Card.Description>
										Set a system-wide keyboard shortcut that works even when the
										app is not in focus
									</Card.Description>
								</Card.Header>
								<Card.Content>
									<Input
										id="global-shortcut-{command.id}"
										placeholder="Global Shortcut"
										value={settings.value[`shortcuts.global.${command.id}`]}
										type="text"
										autocomplete="off"
										disabled
										class="cursor-not-allowed"
									/>
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
					<div
						class="absolute inset-0 bg-background/40 backdrop-blur-sm hover:bg-background/50 transition-all duration-200 flex flex-col items-center justify-center rounded-md"
					>
						<div class="text-center mb-4 max-w-md">
							<h3 class="font-medium text-lg mb-2">Global Shortcuts</h3>
							<p class="text-muted-foreground text-sm">
								Available only in the desktop app
							</p>
						</div>
						<Button
							href="/global-shortcut"
							variant="default"
							size="lg"
							class="shadow-md hover:shadow-lg transition-shadow"
						>
							Enable Global Shortcuts
						</Button>
					</div>
				</div>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
