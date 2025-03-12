<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { tryAsync, trySync } from '@epicenterhq/result';
	import { WhisperingErr } from '@repo/shared';
	import hotkeys from 'hotkeys-js';
	import HotkeysJsFormatGuide from './HotkeysJsFormatGuide.svelte';
	import ShortcutTable from './ShortcutTable.svelte';
	import TauriGlobalShortcutFormatGuide from './TauriGlobalShortcutFormatGuide.svelte';

	const shortcutsRegister = getShortcutsRegisterFromContext();
</script>

<svelte:head>
	<title>Configure Shortcuts - Whispering</title>
</svelte:head>

<div class="container mx-auto py-6 max-w-4xl">
	<header class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">Keyboard Shortcuts</h1>
		<p class="text-muted-foreground mt-2">
			Configure keyboard shortcuts to quickly access Whispering features.
		</p>
	</header>

	<Tabs.Root value="local" class="w-full">
		<Tabs.List class="grid grid-cols-2 mb-6 w-full">
			<Tabs.Trigger value="local" class="text-sm font-medium">
				Local Shortcuts</Tabs.Trigger
			>
			<Tabs.Trigger value="global" class="text-sm font-medium">
				Global Shortcuts</Tabs.Trigger
			>
		</Tabs.List>

		<Tabs.Content value="local" class="space-y-8">
			<section>
				<div class="space-y-2">
					<h2 class="text-2xl font-semibold tracking-tight">Local Shortcuts</h2>
					<p class="text-sm text-muted-foreground">
						Set keyboard shortcuts that work when the app is in focus. These
						shortcuts will only trigger when Whispering is the active
						application.
					</p>
				</div>
				<Separator class="my-6" />

				<div class="bg-card rounded-lg border p-4 shadow-sm mb-6">
					<HotkeysJsFormatGuide />
				</div>

				<ShortcutTable
					getShortcutKeysForCommand={(command) =>
						settings.value[`shortcuts.local.${command.id}`].split('+')}
					getDefaultShortcutForCommand={(command) =>
						command.defaultLocalShortcut}
					registerShortcutKeyAndUpdateSettings={({ command, shortcutKey }) => {
						const currentCommandKey =
							settings.value[`shortcuts.local.${command.id}`];
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
									description: `Press the shortcut to trigger "${command.title}"`,
								});
							},
							onError: (error) => {
								toast.error(error);
							},
						});
					}}
				/>
			</section>
		</Tabs.Content>

		<Tabs.Content value="global" class="space-y-8">
			<section>
				<div class="space-y-2">
					<h2 class="text-2xl font-semibold tracking-tight">
						Global Shortcuts
					</h2>
					<p class="text-sm text-muted-foreground">
						Set system-wide keyboard shortcuts that work even when Whispering is
						not in focus. These shortcuts will trigger from anywhere on your
						system.
					</p>
				</div>
				<Separator class="my-6" />

				{#if window.__TAURI_INTERNALS__}
					<div class="bg-card rounded-lg border p-4 shadow-sm mb-6">
						<TauriGlobalShortcutFormatGuide />
					</div>

					<ShortcutTable
						getShortcutKeysForCommand={(command) =>
							settings.value[`shortcuts.global.${command.id}`].split('+')}
						getDefaultShortcutForCommand={(command) =>
							command.defaultGlobalShortcut}
						registerShortcutKeyAndUpdateSettings={async ({ command, shortcutKey, }) => {
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
					description: `Press the shortcut to trigger "${command.title}"`,
				});
			},
			onError: (error) => {
				toast.error(error);
			},
		});
	}}
					/>
				{:else}
					<div class="rounded-lg border bg-card text-card-foreground shadow-sm">
						<div
							class="p-8 flex flex-col items-center justify-center text-center"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-muted-foreground mb-6"
							>
								<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
								<path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
								<path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
							</svg>
							<h3 class="text-xl font-medium mb-3">Global Shortcuts</h3>
							<p class="text-muted-foreground mb-8 max-w-md">
								Global shortcuts allow you to use Whispering from any
								application on your computer. This feature is only available in
								the desktop app.
							</p>
							<a
								href="/global-shortcut"
								class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 font-medium"
							>
								Enable Global Shortcuts
							</a>
						</div>
					</div>
				{/if}
			</section>
		</Tabs.Content>
	</Tabs.Root>
</div>
