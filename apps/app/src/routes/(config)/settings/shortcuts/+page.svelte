<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Search } from 'lucide-svelte';
	import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { tryAsync, trySync } from '@epicenterhq/result';
	import { type Command, WhisperingErr, commands } from '@repo/shared';
	import hotkeys from 'hotkeys-js';
	import HotkeysJsFormatGuide from './HotkeysJsFormatGuide.svelte';
	import TauriGlobalShortcutFormatGuide from './TauriGlobalShortcutFormatGuide.svelte';

	const shortcutsRegister = getShortcutsRegisterFromContext();
	let searchQuery = '';
	let selectedCommand: Command | null = null;
	let editingShortcut = '';
	let isGlobalShortcut = false;
	let popoverOpen = false;
	let activeCommandId = '';

	// Filter commands based on search query
	$: filteredCommands = commands.filter((command) =>
		command.description.toLowerCase().includes(searchQuery.toLowerCase()),
	);

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
				popoverOpen = false;
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
				popoverOpen = false;
			},
			onError: (error) => {
				toast.error(error);
			},
		});
	}

	function openEditPopover(command: Command, isGlobal: boolean) {
		selectedCommand = command;
		isGlobalShortcut = isGlobal;
		editingShortcut = isGlobal
			? settings.value[`shortcuts.global.${command.id}`] || ''
			: settings.value[`shortcuts.local.${command.id}`] || '';
		activeCommandId = command.id;
		popoverOpen = true;
	}

	function saveShortcut() {
		if (!selectedCommand) return;

		if (isGlobalShortcut) {
			registerGlobalShortcut(selectedCommand, editingShortcut);
		} else {
			registerLocalShortcut(selectedCommand, editingShortcut);
		}
	}

	function clearShortcut() {
		if (!selectedCommand) return;

		if (isGlobalShortcut) {
			registerGlobalShortcut(selectedCommand, '');
		} else {
			registerLocalShortcut(selectedCommand, '');
		}
	}

	function handleInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		editingShortcut = target.value;
	}
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
			<Tabs.Trigger value="local" class="text-sm font-medium"
				>Local Shortcuts</Tabs.Trigger
			>
			<Tabs.Trigger value="global" class="text-sm font-medium"
				>Global Shortcuts</Tabs.Trigger
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

				<!-- Search input -->
				<div class="relative mb-6">
					<Search
						class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="search"
						placeholder="Search commands..."
						class="pl-10"
						bind:value={searchQuery}
					/>
				</div>

				<!-- Command list with shortcuts -->
				<div class="rounded-lg border bg-card">
					<div class="p-0">
						<table class="w-full">
							<thead>
								<tr class="border-b">
									<th class="text-left p-4 font-medium text-muted-foreground"
										>Command</th
									>
									<th class="text-right p-4 font-medium text-muted-foreground"
										>Shortcut</th
									>
								</tr>
							</thead>
							<tbody>
								{#each filteredCommands as command}
									<tr class="border-b last:border-0 hover:bg-muted/50">
										<td class="p-4">{command.description}</td>
										<td class="p-4 text-right">
											<Popover.Root
												open={popoverOpen && activeCommandId === command.id}
											>
												<Popover.Trigger>
													{#if settings.value[`shortcuts.local.${command.id}`]}
														<button
															class="inline-flex items-center gap-1 hover:bg-muted rounded px-2 py-1"
															on:click={() => openEditPopover(command, false)}
														>
															{#each settings.value[`shortcuts.local.${command.id}`].split('+') as key}
																<kbd
																	class="inline-flex h-6 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground"
																>
																	{key}
																</kbd>
															{/each}
														</button>
													{:else}
														<button
															class="text-sm text-muted-foreground hover:text-foreground hover:underline"
															on:click={() => openEditPopover(command, false)}
														>
															Add shortcut
														</button>
													{/if}
												</Popover.Trigger>
												<Popover.Content class="w-80 p-4" align="end">
													<div class="space-y-4">
														<div>
															<h4 class="font-medium leading-none mb-2">
																{command.description}
															</h4>
															<p class="text-sm text-muted-foreground">
																Set a local keyboard shortcut
															</p>
														</div>

														<div>
															<Input
																placeholder={`e.g. ${command.defaultLocalShortcut}`}
																bind:value={editingShortcut}
																autocomplete="off"
																class="w-full"
															/>
														</div>

														{#if editingShortcut}
															<div class="flex flex-wrap gap-1">
																{#each editingShortcut.split('+') as key}
																	<kbd
																		class="inline-flex h-7 select-none items-center justify-center rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground"
																	>
																		{key}
																	</kbd>
																{/each}
															</div>
														{/if}

														<div class="flex justify-between">
															<Button
																variant="outline"
																size="sm"
																on:click={clearShortcut}
															>
																Clear
															</Button>
															<Button size="sm" on:click={saveShortcut}>
																Save
															</Button>
														</div>
													</div>
												</Popover.Content>
											</Popover.Root>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
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

					<!-- Search input -->
					<div class="relative mb-6">
						<Search
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							type="search"
							placeholder="Search commands..."
							class="pl-10"
							bind:value={searchQuery}
						/>
					</div>

					<!-- Command list with shortcuts -->
					<div class="rounded-lg border bg-card">
						<div class="p-0">
							<table class="w-full">
								<thead>
									<tr class="border-b">
										<th class="text-left p-4 font-medium text-muted-foreground"
											>Command</th
										>
										<th class="text-right p-4 font-medium text-muted-foreground"
											>Shortcut</th
										>
									</tr>
								</thead>
								<tbody>
									{#each filteredCommands as command}
										<tr class="border-b last:border-0 hover:bg-muted/50">
											<td class="p-4">{command.description}</td>
											<td class="p-4 text-right">
												<Popover.Root
													open={popoverOpen && activeCommandId === command.id}
												>
													<Popover.Trigger>
														{#if settings.value[`shortcuts.global.${command.id}`]}
															<button
																class="inline-flex items-center gap-1 hover:bg-muted rounded px-2 py-1"
																on:click={() => openEditPopover(command, true)}
															>
																{#each settings.value[`shortcuts.global.${command.id}`].split('+') as key}
																	<kbd
																		class="inline-flex h-6 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground"
																	>
																		{key}
																	</kbd>
																{/each}
															</button>
														{:else}
															<button
																class="text-sm text-muted-foreground hover:text-foreground hover:underline"
																on:click={() => openEditPopover(command, true)}
															>
																Add shortcut
															</button>
														{/if}
													</Popover.Trigger>
													<Popover.Content class="w-80 p-4" align="end">
														<div class="space-y-4">
															<div>
																<h4 class="font-medium leading-none mb-2">
																	{command.description}
																</h4>
																<p class="text-sm text-muted-foreground">
																	Set a global keyboard shortcut
																</p>
															</div>

															<div>
																<Input
																	placeholder="e.g. CommandOrControl+Shift+P"
																	bind:value={editingShortcut}
																	autocomplete="off"
																	class="w-full"
																/>
															</div>

															{#if editingShortcut}
																<div class="flex flex-wrap gap-1">
																	{#each editingShortcut.split('+') as key}
																		<kbd
																			class="inline-flex h-7 select-none items-center justify-center rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground"
																		>
																			{key}
																		</kbd>
																	{/each}
																</div>
															{/if}

															<div class="flex justify-between">
																<Button
																	variant="outline"
																	size="sm"
																	on:click={clearShortcut}
																>
																	Clear
																</Button>
																<Button size="sm" on:click={saveShortcut}>
																	Save
																</Button>
															</div>
														</div>
													</Popover.Content>
												</Popover.Root>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
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
							<Button
								href="/global-shortcut"
								variant="default"
								size="lg"
								class="font-medium"
							>
								Enable Global Shortcuts
							</Button>
						</div>
					</div>
				{/if}
			</section>
		</Tabs.Content>
	</Tabs.Root>
</div>
