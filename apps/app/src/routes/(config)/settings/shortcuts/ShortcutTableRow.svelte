<script lang="ts">
	import { KeyboardShortcutRecorder } from '$lib/components/ui/keyboard-shortcut-recorder';
	import * as Table from '$lib/components/ui/table/index.js';
	import { type Command } from '@repo/shared';

	const {
		command,
		getShortcutKeyForCommand,
		getDefaultShortcutForCommand,
		registerShortcutKeyAndUpdateSettings,
	} = $props<{
		command: Command;
		getShortcutKeyForCommand: (command: Command) => string;
		getDefaultShortcutForCommand: (command: Command) => string;
		registerShortcutKeyAndUpdateSettings: ({
			command,
			shortcutKey,
		}: {
			command: Command;
			shortcutKey: string;
		}) => void;
	}>();

	const shortcutKey = $derived(getShortcutKeyForCommand(command));
</script>

<Table.Row>
	<Table.Cell>{command.description}</Table.Cell>

	<Table.Cell class="text-right">
		<KeyboardShortcutRecorder
			title={command.description}
			value={shortcutKey}
			onValueChange={(shortcutKey: string) => {
				registerShortcutKeyAndUpdateSettings({
					command,
					shortcutKey,
				});
			}}
			placeholder={`e.g. ${getDefaultShortcutForCommand(command)}`}
			autoFocus
		/>
	</Table.Cell>
</Table.Row>
