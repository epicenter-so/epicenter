<script lang="ts">
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

	const shortcutsRegister = getShortcutsRegisterFromContext();

	function registerLocalShortcut(command: Command, value: string) {
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
			shortcutKey: value,
			onSuccess: () => {
				settings.value = {
					...settings.value,
					[`shortcuts.local.${command.id}`]: value,
				};
				toast.success({
					title: `Local shortcut set to ${value}`,
					description: `Press the shortcut to ${command.description}`,
				});
			},
			onError: (error) => {
				toast.error(error);
			},
		});
	}

	async function registerGlobalShortcut(command: Command, value: string) {
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
			shortcutKey: value,
			onSuccess: () => {
				settings.value = {
					...settings.value,
					[`shortcuts.global.${command.id}`]: value,
				};
				toast.success({
					title: `Global shortcut set to ${value}`,
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
			{#each commands as command}
				<Card.Root>
					<Card.Header class="pb-2">
						<Card.Title class="text-base">{command.description}</Card.Title>
						<Card.Description>
							Set a keyboard shortcut that works when the app is in focus
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<Input
							id="local-shortcut-{command.id}"
							placeholder="Press keys to set shortcut"
							value={settings.value[`shortcuts.local.${command.id}`]}
							oninput={({ currentTarget: { value } }) =>
								registerLocalShortcut(command, value)}
							autocomplete="off"
						/>
					</Card.Content>
				</Card.Root>
			{/each}
		</Tabs.Content>

		<Tabs.Content value="global" class="space-y-4 mt-4">
			{#if window.__TAURI_INTERNALS__}
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
							<Input
								id="global-shortcut-{command.id}"
								placeholder="Press keys to set global shortcut"
								value={settings.value[`shortcuts.global.${command.id}`]}
								oninput={({ currentTarget: { value } }) =>
									registerGlobalShortcut(command, value)}
								autocomplete="off"
							/>
						</Card.Content>
					</Card.Root>
				{/each}
			{:else}
				<div class="relative">
					<div class="space-y-4">
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
										class="cursor-not-allowed opacity-50"
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
