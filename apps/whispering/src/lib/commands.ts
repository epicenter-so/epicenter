import { rpc } from '$lib/query';

import type { ShortcutTriggerState } from './services/_shortcut-trigger-state';

type SatisfiedCommand = {
	callback: () => void;
	id: string;
	on: ShortcutTriggerState;
	title: string;
};

export const commands = [
	{
		title: 'Push to talk',
		callback: () => rpc.commands.toggleManualRecording.execute(undefined),
		id: 'pushToTalk',
		on: 'Both',
	},
	{
		title: 'Toggle recording',
		callback: () => rpc.commands.toggleManualRecording.execute(undefined),
		id: 'toggleManualRecording',
		on: 'Pressed',
	},
	{
		title: 'Start recording',
		callback: () => rpc.commands.startManualRecording.execute(undefined),
		id: 'startManualRecording',
		on: 'Pressed',
	},
	{
		title: 'Stop recording',
		callback: () => rpc.commands.stopManualRecording.execute(undefined),
		id: 'stopManualRecording',
		on: 'Pressed',
	},
	{
		title: 'Cancel recording',
		callback: () => rpc.commands.cancelManualRecording.execute(undefined),
		id: 'cancelManualRecording',
		on: 'Pressed',
	},
	{
		title: 'Start voice activated recording',
		callback: () => rpc.commands.startVadRecording.execute(undefined),
		id: 'startVadRecording',
		on: 'Pressed',
	},
	{
		title: 'Stop voice activated recording',
		callback: () => rpc.commands.stopVadRecording.execute(undefined),
		id: 'stopVadRecording',
		on: 'Pressed',
	},
	{
		title: 'Toggle voice activated recording',
		callback: () => rpc.commands.toggleVadRecording.execute(undefined),
		id: 'toggleVadRecording',
		on: 'Pressed',
	},
	{
		title: 'Cycle through favorite output languages',
		callback: () => rpc.commands.toggleOutputLanguage.execute(undefined),
		id: 'toggleOutputLanguage',
		on: 'Pressed',
	},
	{
		title: 'Switch to favorite language #1',
		callback: () => rpc.commands.setOutputLanguageSlot.execute({ slot: 1 }),
		id: 'setOutputLanguageSlot1',
		on: 'Pressed',
	},
	{
		title: 'Switch to favorite language #2',
		callback: () => rpc.commands.setOutputLanguageSlot.execute({ slot: 2 }),
		id: 'setOutputLanguageSlot2',
		on: 'Pressed',
	},
	{
		title: 'Switch to favorite language #3',
		callback: () => rpc.commands.setOutputLanguageSlot.execute({ slot: 3 }),
		id: 'setOutputLanguageSlot3',
		on: 'Pressed',
	},
] as const satisfies SatisfiedCommand[];

export type Command = (typeof commands)[number];

type CommandCallbacks = Record<Command['id'], Command['callback']>;

export const commandCallbacks = commands.reduce<CommandCallbacks>(
	(acc, command) => {
		acc[command.id] = command.callback;
		return acc;
	},
	{} as CommandCallbacks,
);
