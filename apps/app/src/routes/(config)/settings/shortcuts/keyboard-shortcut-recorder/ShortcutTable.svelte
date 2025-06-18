<script lang="ts">
	import { commands } from '$lib/commands';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { settings } from '$lib/stores/settings.svelte';
	import { Search, X } from 'lucide-svelte';
	import GlobalKeyboardShortcutRecorder from './GlobalKeyboardShortcutRecorder.svelte';
	import LocalKeyboardShortcutRecorder from './LocalKeyboardShortcutRecorder.svelte';

	let { type }: { type: 'local' | 'global' } = $props();

	let searchQuery = $state('');

	const filteredCommands = $derived(
		commands.filter((command) =>
			command.title.toLowerCase().includes(searchQuery.toLowerCase()),
		),
	);
</script>

<div class="space-y-4">
	<!-- Search input -->
	<div class="relative">
		<Search
			class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
		/>
		<Input
			type="search"
			placeholder="Search commands..."
			class="pl-10"
			bind:value={searchQuery}
		/>
	</div>

	<!-- Command list with shortcuts -->
	<div class="overflow-x-auto rounded-lg border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="min-w-[150px]">Command</Table.Head>
					<Table.Head class="text-right min-w-[200px]">Shortcut</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each filteredCommands as command}
					{@const shortcutValue =
						settings.value[`shortcuts.${type}.${command.id}`]}
					{@const defaultShortcut =
						type === 'local'
							? command.defaultLocalShortcut
							: command.defaultGlobalShortcut}
					<Table.Row>
						<Table.Cell class="font-medium">
							<span class="block truncate pr-2">{command.title}</span>
						</Table.Cell>
						<Table.Cell class="text-right">
							<div class="flex items-center justify-end gap-2">
								{#if shortcutValue}
									<Badge
										variant="secondary"
										class="font-mono text-xs max-w-[120px] truncate"
									>
										{shortcutValue}
									</Badge>
									<Button
										variant="ghost"
										size="icon"
										class="size-8 shrink-0"
										onclick={() => {
											settings.value = {
												...settings.value,
												[`shortcuts.${type}.${command.id}`]: null,
											};
										}}
									>
										<X class="size-4" />
										<span class="sr-only">Clear shortcut</span>
									</Button>
								{:else}
									<span class="text-sm text-muted-foreground">Not set</span>
								{/if}

								{#if type === 'local'}
									<LocalKeyboardShortcutRecorder
										{command}
										placeholder={defaultShortcut
											? `Default: ${defaultShortcut}`
											: 'Set shortcut'}
									/>
								{:else}
									<GlobalKeyboardShortcutRecorder
										{command}
										placeholder={defaultShortcut
											? `Default: ${defaultShortcut}`
											: 'Set shortcut'}
									/>
								{/if}
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
