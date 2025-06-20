<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Layers2Icon, RotateCcw } from 'lucide-svelte';
	import ShortcutTable from './keyboard-shortcut-recorder/ShortcutTable.svelte';
	import ShortcutFormatHelp from './keyboard-shortcut-recorder/ShortcutFormatHelp.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { commands } from '$lib/commands';
	import { toast } from '$lib/toast';
	import type { Settings } from '@repo/shared/settings';

	const resetToDefaults = (type: 'local' | 'global') => {
		const updates = commands.reduce((acc, command) => {
			acc[`shortcuts.${type}.${command.id}`] =
				type === 'local'
					? command.defaultLocalShortcut
					: command.defaultGlobalShortcut;
			return acc;
		}, {} as Partial<Settings>);

		settings.value = {
			...settings.value,
			...updates,
		};

		toast.success({
			title: 'Shortcuts reset',
			description: `All ${type} shortcuts have been reset to defaults.`,
		});
	};
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

	<Tabs.Root value="local">
		<Tabs.List class="w-full">
			<Tabs.Trigger value="local">Local Shortcuts</Tabs.Trigger>
			<Tabs.Trigger value="global">Global Shortcuts</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="local" class="space-y-6">
			<div
				class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
			>
				<div class="space-y-1">
					<div class="flex items-center gap-2">
						<h2 class="text-xl sm:text-2xl font-semibold tracking-tight">
							Local Shortcuts
						</h2>
						<ShortcutFormatHelp type="local" />
					</div>
					<p class="text-sm text-muted-foreground">
						Set keyboard shortcuts that work when the app is in focus. These
						shortcuts will only trigger when Whispering is the active
						application.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onclick={() => resetToDefaults('local')}
					class="w-full sm:w-auto"
				>
					<RotateCcw class="mr-2 size-4" />
					Reset to defaults
				</Button>
			</div>

			<Separator />

			<ShortcutTable type="local" />
		</Tabs.Content>

		<Tabs.Content value="global" class="space-y-6">
			{#if window.__TAURI_INTERNALS__}
				<div
					class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
				>
					<div class="space-y-1">
						<div class="flex items-center gap-2">
							<h2 class="text-xl sm:text-2xl font-semibold tracking-tight">
								Global Shortcuts
							</h2>
							<ShortcutFormatHelp type="global" />
						</div>
						<p class="text-sm text-muted-foreground">
							Set system-wide keyboard shortcuts that work even when Whispering
							is not in focus. These shortcuts will trigger from anywhere on
							your system.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onclick={() => resetToDefaults('global')}
						class="w-full sm:w-auto"
					>
						<RotateCcw class="mr-2 size-4" />
						Reset to defaults
					</Button>
				</div>

				<Separator />

				<ShortcutTable type="global" />
			{:else}
				<div class="rounded-lg border bg-card text-card-foreground shadow-xs">
					<div
						class="p-8 flex flex-col items-center justify-center text-center"
					>
						<Layers2Icon class="size-10" />
						<h3 class="text-xl font-medium my-3">Global Shortcuts</h3>
						<p class="text-muted-foreground mb-8 max-w-md">
							Global shortcuts allow you to use Whispering from any application
							on your computer. This feature is only available in the desktop
							app or browser extension.
						</p>
						<a
							href="/desktop-app"
							class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 font-medium"
						>
							Enable Global Shortcuts
						</a>
					</div>
				</div>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
