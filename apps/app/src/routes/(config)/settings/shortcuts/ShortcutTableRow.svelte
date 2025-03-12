<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { type Command } from '@repo/shared';

	const {
		command,
		getShortcutKeyForCommand,
		getDefaultShortcutForCommand,
		registerShortcut,
	} = $props<{
		command: Command;
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

	const shortcutKey = $derived(getShortcutKeyForCommand(command));

	let isPopoverOpen = $state(false);

	function registerShortcutKey({ shortcutKey }: { shortcutKey: string }) {
		registerShortcut({
			command,
			shortcutKey,
		});
	}
</script>

<Table.Row>
	<Table.Cell>{command.description}</Table.Cell>
	<Table.Cell class="text-right">
		<Popover.Root bind:open={isPopoverOpen}>
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

					<div class="flex gap-2">
						<Input
							placeholder={`e.g. ${getDefaultShortcutForCommand(command)}`}
							value={shortcutKey}
							oninput={({ currentTarget: { value } }) =>
								registerShortcutKey({
									shortcutKey: value,
								})}
							autocomplete="off"
						/>
						<Button
							variant="outline"
							onclick={() => {
								registerShortcutKey({
									shortcutKey: '',
								});
							}}
						>
							Clear
						</Button>
					</div>

					{#if shortcutKey}
						<div class="flex flex-wrap gap-1">
							{#each shortcutKey.split('+') as key}
								<kbd
									class="inline-flex h-7 select-none items-center justify-center rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground"
								>
									{key}
								</kbd>
							{/each}
						</div>
					{/if}
				</div>
			</Popover.Content>
		</Popover.Root>
	</Table.Cell>
</Table.Row>
