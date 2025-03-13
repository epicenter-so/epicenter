<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { commands } from '@repo/shared';
	import { Search } from 'lucide-svelte';
	import LocalKeyboardShortcutRecorder from './LocalKeyboardShortcutRecorder.svelte';

	let searchQuery = $state('');

	const filteredCommands = $derived(
		commands.filter((command) =>
			command.title.toLowerCase().includes(searchQuery.toLowerCase()),
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
				<Table.Row>
					<Table.Cell>{command.title}</Table.Cell>

					<Table.Cell class="text-right">
						<LocalKeyboardShortcutRecorder
							{command}
							placeholder={`e.g. ${command.defaultLocalShortcut}`}
							autoFocus
						/>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
