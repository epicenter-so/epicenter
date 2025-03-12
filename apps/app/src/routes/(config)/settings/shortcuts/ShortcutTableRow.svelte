<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { type Command } from '@repo/shared';

	const { command, getShortcutForCommand, registerShortcut } = $props<{
		command: Command;
		getShortcutForCommand: (command: Command) => string;
		registerShortcut: ({
			command,
			shortcutKey,
			onSuccess,
		}: {
			command: Command;
			shortcutKey: string;
			onSuccess: () => void;
		}) => void;
	}>();

	let editingShortcut = $state('');
	let isPopoverOpen = $state(false);

	const shortcutKey = $derived(getShortcutForCommand(command));
</script>

<Table.Row>
	<Table.Cell>{command.description}</Table.Cell>
	<Table.Cell class="text-right">
		<Popover.Root
			open={isPopoverOpen}
			onOpenChange={(open) => {
				editingShortcut = shortcutKey;
				isPopoverOpen = open;
			}}
		>
			<Popover.Trigger
				class="inline-flex items-center gap-1 hover:bg-muted rounded px-2 py-1"
			>
				{#if shortcutKey}
					{#each shortcutKey.split('+') as key}
						<kbd
							class="inline-flex h-6 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground"
						>
							{key}
						</kbd>
					{/each}
				{:else}
					<button
						class="text-sm text-muted-foreground hover:text-foreground hover:underline"
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
						<p class="text-sm text-muted-foreground">Set a keyboard shortcut</p>
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
						<button
							class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
							onclick={() => {
								registerShortcut({
									command,
									shortcutKey: '',
									onSuccess: () => {
										editingShortcut = '';
									},
								});
							}}
						>
							Clear
						</button>
						<button
							class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
							onclick={() => {
								registerShortcut({
									command,
									shortcutKey: editingShortcut,
									onSuccess: () => {
										editingShortcut = '';
									},
								});
							}}
						>
							Save
						</button>
					</div>
				</div>
			</Popover.Content>
		</Popover.Root>
	</Table.Cell>
</Table.Row>
