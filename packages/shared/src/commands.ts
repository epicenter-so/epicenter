export const commands = [
	{
		id: 'toggleManualRecording',
		description: 'Toggle manual recording',
		defaultLocalShortcut: 'space',
		defaultGlobalShortcut: 'CommandOrControl+Shift+{',
	},
	{
		id: 'cancelManualRecording',
		description: 'Cancel manual recording',
		defaultLocalShortcut: 'c',
		defaultGlobalShortcut: 'CommandOrControl+Shift+}',
	},
	{
		id: 'closeManualRecordingSession',
		description: 'Close manual recording session',
		defaultLocalShortcut: 'shift+c',
		defaultGlobalShortcut: 'CommandOrControl+Shift+\\',
	},
	{
		id: 'pushToTalk',
		description: 'Push to talk',
		defaultLocalShortcut: 'p',
		defaultGlobalShortcut: 'CommandOrControl+Shift+;',
	},
	{
		id: 'toggleVadRecording',
		description: 'Toggle vad recording',
		defaultLocalShortcut: 'v',
		defaultGlobalShortcut: "CommandOrControl+Shift+'",
	},
] as const;

export type Command = (typeof commands)[number];
