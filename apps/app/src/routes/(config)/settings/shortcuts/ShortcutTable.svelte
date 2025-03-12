<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { commands, type Command } from '@repo/shared';
	import { Search } from 'lucide-svelte';
	import ShortcutTableRow from './ShortcutTableRow.svelte';

	const {
		getShortcutKeyForCommand,
		getDefaultShortcutForCommand,
		registerShortcut,
	} = $props<{
		getShortcutKeyForCommand: (command: Command) => string;
		getDefaultShortcutForCommand: (command: Command) => string;
		registerShortcut: ({
			command,
			shortcutKey,
		}: {
			command: Command;
			shortcutKey: string;
		}) => void;
	}>();

	let searchQuery = $state('');

	const filteredCommands = $derived(
		commands.filter((command) =>
			command.description.toLowerCase().includes(searchQuery.toLowerCase()),
		),
	);
</script>

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
<div class="rounded-lg border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Command</Table.Head>
				<Table.Head class="text-right">Shortcut</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each filteredCommands as command}
				<ShortcutTableRow
					{command}
					{getShortcutKeyForCommand}
					{getDefaultShortcutForCommand}
					{registerShortcut}
				/>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
