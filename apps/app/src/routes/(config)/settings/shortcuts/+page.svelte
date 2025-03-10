<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { tryAsync, trySync } from '@epicenterhq/result';
	import { WhisperingErr } from '@repo/shared';
	import type { Command } from '@repo/shared/settings';
	import { commands } from '@repo/shared/settings';
	import hotkeys from 'hotkeys-js';
	import { InfoIcon, KeyboardIcon } from 'lucide-svelte';

	const shortcutsRegister = getShortcutsRegisterFromContext();

	const modifiers = [
		{ symbol: '⇧', name: 'shift' },
		{ symbol: '⌥', name: 'option/alt' },
		{ symbol: '⌃', name: 'ctrl/control' },
		{ symbol: '⌘', name: 'command' },
		{ symbol: '⇪', name: 'caps lock' },
	];

	const specialKeys = [
		'backspace',
		'tab',
		'clear',
		'enter',
		'return',
		'esc',
		'escape',
		'space',
		'up',
		'down',
		'left',
		'right',
		'home',
		'end',
		'pageup',
		'pagedown',
		'del',
		'delete',
		'f1-f19',
		'num_0-num_9',
		'num_multiply',
		'num_add',
		'num_enter',
		'num_subtract',
		'num_decimal',
		'num_divide',
	];

	const shortcutExamples = [
		'ctrl+a',
		'command+shift+p',
		'alt+s',
		'f5',
		'ctrl+alt+delete',
		'shift+/',
		'⌘+space',
		'⌃+⌥+del',
	];

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

	<div class="bg-muted/50 p-4 rounded-md mb-4">
		<div class="flex items-start gap-3">
			<KeyboardIcon class="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
			<div>
				<h4 class="font-medium text-sm mb-1">Shortcut Format Guide</h4>
				<p class="text-muted-foreground text-sm mb-2">
					Use the following format for shortcuts:
					<Badge variant="secondary" class="font-mono">modifier+key</Badge>
					or just
					<Badge variant="secondary" class="font-mono">key</Badge>
					for single keys.
				</p>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
					<div>
						<h5 class="text-xs font-medium mb-2">Supported Modifiers</h5>
						<div class="flex flex-wrap gap-2">
							{#each modifiers as { symbol, name }}
								<div class="flex items-center gap-1.5">
									<Badge variant="secondary" class="font-mono">{symbol}</Badge>
									<span class="text-xs text-muted-foreground">{name}</span>
								</div>
							{/each}
						</div>
					</div>

					<div>
						<h5 class="text-xs font-medium mb-2">Special Keys</h5>
						<div class="flex flex-wrap gap-1.5">
							{#each specialKeys as key}
								<Badge variant="outline" class="text-xs">{key}</Badge>
							{/each}
						</div>
					</div>
				</div>

				<div>
					<h5 class="text-xs font-medium mb-2">Examples (click to copy)</h5>
					<div class="flex flex-wrap gap-2">
						{#each shortcutExamples as example}
							<Badge
								variant="outline"
								class="cursor-pointer hover:bg-muted/80 transition-colors"
								onclick={() => {
									navigator.clipboard.writeText(example);
									toast.success({
										title: 'Copied to clipboard',
										description: `Shortcut format: ${example}`,
									});
								}}
							>
								{example}
							</Badge>
						{/each}
					</div>
				</div>

				<div class="mt-4">
					<h5 class="text-xs font-medium mb-2">Multiple Key Combinations</h5>
					<p class="text-muted-foreground text-xs mb-2">
						You can bind multiple shortcuts to the same action by separating
						them with commas:
					</p>
					<Badge variant="secondary" class="font-mono mb-2"
						>ctrl+r,command+r</Badge
					>
					<p class="text-muted-foreground text-xs">
						This will trigger the action when either <span class="font-mono"
							>ctrl+r</span
						>
						OR <span class="font-mono">command+r</span> is pressed.
					</p>
				</div>

				<div class="mt-3 flex items-center gap-1.5">
					<InfoIcon class="h-3.5 w-3.5 text-blue-500" />
					<a
						href="https://github.com/jaywcjlove/hotkeys-js#documentation"
						target="_blank"
						rel="noopener noreferrer"
						class="text-xs text-blue-500 hover:underline"
					>
						View hotkeys-js documentation
					</a>
				</div>
			</div>
		</div>
	</div>

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
								<Badge variant="status.running">Active</Badge>
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
									<Badge variant="status.completed">Global</Badge>
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
							<Badge variant="status.failed" class="mt-2">Desktop Only</Badge>
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
