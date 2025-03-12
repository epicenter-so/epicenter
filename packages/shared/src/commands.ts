export const commands = [
	{
		id: 'toggleManualRecording',
		description: 'Toggle manual recording',
		defaultLocalShortcut: 'space',
	},
	{
		id: 'cancelManualRecording',
		description: 'Cancel manual recording',
		defaultLocalShortcut: 'c',
	},
	{
		id: 'closeManualRecordingSession',
		description: 'Close manual recording session',
		defaultLocalShortcut: 'shift+c',
	},
	{ id: 'pushToTalk', description: 'Push to talk', defaultLocalShortcut: 'p' },
	{
		id: 'toggleVadRecording',
		description: 'Toggle vad recording',
		defaultLocalShortcut: 'v',
	},
] as const;

export type Command = (typeof commands)[number];
