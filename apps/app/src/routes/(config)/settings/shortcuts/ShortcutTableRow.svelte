<script lang="ts">
	import { KeyboardShortcutRecorder } from '$lib/components/ui/keyboard-shortcut-recorder/index.svelte.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { type Command } from '@repo/shared';

	const {
		command,
		getShortcutKeysForCommand,
		getDefaultShortcutForCommand,
		registerShortcutKeyAndUpdateSettings,
	}: {
		command: Command;
		getShortcutKeysForCommand: (command: Command) => string[];
		getDefaultShortcutForCommand: (command: Command) => string;
		registerShortcutKeyAndUpdateSettings: ({
			command,
			shortcutKey,
		}: {
			command: Command;
			shortcutKey: string;
		}) => void;
	} = $props();
</script>

<Table.Row>
	<Table.Cell>{command.title}</Table.Cell>

	<Table.Cell class="text-right">
		<KeyboardShortcutRecorder
			title={command.title}
			keys={getShortcutKeysForCommand(command)}
			onKeysChange={(shortcutKeys) => {
				registerShortcutKeyAndUpdateSettings({
					command,
					shortcutKeys,
				});
			}}
			placeholder={`e.g. ${getDefaultShortcutForCommand(command)}`}
			autoFocus
		/>
	</Table.Cell>
</Table.Row>
