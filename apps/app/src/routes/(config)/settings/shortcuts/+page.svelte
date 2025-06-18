<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Layers2Icon } from 'lucide-svelte';
	import HotkeysJsFormatGuide from './HotkeysJsFormatGuide.svelte';
	import TauriGlobalShortcutFormatGuide from './TauriGlobalShortcutFormatGuide.svelte';
	import {
		GlobalShortcutTable,
		LocalShortcutTable,
	} from './keyboard-shortcut-recorder/index.svelte';
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

				<div class="bg-card rounded-lg border p-4 shadow-xs mb-6">
					<HotkeysJsFormatGuide />
				</div>

				<LocalShortcutTable />
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
					<div class="bg-card rounded-lg border p-4 shadow-xs mb-6">
						<TauriGlobalShortcutFormatGuide />
					</div>

					<GlobalShortcutTable />
				{:else}
					<div class="rounded-lg border bg-card text-card-foreground shadow-xs">
						<div
							class="p-8 flex flex-col items-center justify-center text-center"
						>
							<Layers2Icon class="size-10" />
							<h3 class="text-xl font-medium my-3">Global Shortcuts</h3>
							<p class="text-muted-foreground mb-8 max-w-md">
								Global shortcuts allow you to use Whispering from any
								application on your computer. This feature is only available in
								the desktop app or browser extension.
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
			</section>
		</Tabs.Content>
	</Tabs.Root>
</div>
