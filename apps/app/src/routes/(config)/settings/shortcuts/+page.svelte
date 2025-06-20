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

<div class="container mx-auto max-w-4xl space-y-6 py-6">
	<header>
		<h1 class="text-3xl font-bold tracking-tight">Keyboard Shortcuts</h1>
		<p class="mt-2 text-muted-foreground">
			Configure keyboard shortcuts to quickly access Whispering features.
		</p>
	</header>

	<Tabs.Root value="local">
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="local">Local Shortcuts</Tabs.Trigger>
			<Tabs.Trigger value="global">Global Shortcuts</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="local" class="mt-6 space-y-6">
			<section>
				<div
					class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
				>
					<header class="space-y-1">
						<div class="flex items-center gap-2">
							<h2 class="text-xl font-semibold tracking-tight sm:text-2xl">
								Local Shortcuts
							</h2>
							<ShortcutFormatHelp type="local" />
						</div>
						<p class="text-sm text-muted-foreground">
							Set keyboard shortcuts that work when the app is in focus. These
							shortcuts will only trigger when Whispering is the active
							application.
						</p>
					</header>
					<Button
						variant="outline"
						size="sm"
						onclick={() => resetToDefaults('local')}
						class="shrink-0"
					>
						<RotateCcw class="mr-2 size-4" />
						Reset to defaults
					</Button>
				</div>

				<Separator class="my-6" />

				<ShortcutTable type="local" />
			</section>
		</Tabs.Content>

		<Tabs.Content value="global" class="mt-6 space-y-6">
			{#if window.__TAURI_INTERNALS__}
				<section>
					<div
						class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
					>
						<header class="space-y-1">
							<div class="flex items-center gap-2">
								<h2 class="text-xl font-semibold tracking-tight sm:text-2xl">
									Global Shortcuts
								</h2>
								<ShortcutFormatHelp type="global" />
							</div>
							<p class="text-sm text-muted-foreground">
								Set system-wide keyboard shortcuts that work even when
								Whispering is not in focus. These shortcuts will trigger from
								anywhere on your system.
							</p>
						</header>
						<Button
							variant="outline"
							size="sm"
							onclick={() => resetToDefaults('global')}
							class="shrink-0"
						>
							<RotateCcw class="mr-2 size-4" />
							Reset to defaults
						</Button>
					</div>

					<Separator class="my-6" />

					<ShortcutTable type="global" />
				</section>
			{:else}
				<div class="rounded-lg border bg-card text-card-foreground shadow-sm">
					<div
						class="flex flex-col items-center justify-center p-8 text-center"
					>
						<Layers2Icon class="mb-4 size-10 text-muted-foreground" />
						<h3 class="mb-2 text-xl font-medium">Global Shortcuts</h3>
						<p class="mb-6 max-w-md text-sm text-muted-foreground">
							Global shortcuts allow you to use Whispering from any application
							on your computer. This feature is only available in the desktop
							app or browser extension.
						</p>
						<Button href="/desktop-app" variant="default">
							Enable Global Shortcuts
						</Button>
					</div>
				</div>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
