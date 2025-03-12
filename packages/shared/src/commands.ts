export const commands = [
	{
		id: 'toggleManualRecording',
		title: 'Toggle manual recording',
		defaultLocalShortcut: 'space',
		defaultGlobalShortcut: 'CommandOrControl+Shift+{',
	},
	{
		id: 'cancelManualRecording',
		title: 'Cancel manual recording',
		defaultLocalShortcut: 'c',
		defaultGlobalShortcut: 'CommandOrControl+Shift+}',
	},
	{
		id: 'closeManualRecordingSession',
		title: 'Close manual recording session',
		defaultLocalShortcut: 'shift+c',
		defaultGlobalShortcut: 'CommandOrControl+Shift+\\',
	},
	{
		id: 'pushToTalk',
		title: 'Push to talk',
		defaultLocalShortcut: 'p',
		defaultGlobalShortcut: 'CommandOrControl+Shift+;',
	},
	{
		id: 'toggleVadRecording',
		title: 'Toggle vad recording',
		defaultLocalShortcut: 'v',
		defaultGlobalShortcut: "CommandOrControl+Shift+'",
	},
] as const;

export type Command = (typeof commands)[number];
