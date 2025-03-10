export const commands = [
	{
		id: 'toggleManualRecording',
		description: 'toggle manual recording',
		defaultLocalShortcut: 'space',
	},
	{
		id: 'cancelManualRecording',
		description: 'cancel manual recording',
		defaultLocalShortcut: 'c',
	},
	{
		id: 'closeManualRecordingSession',
		description: 'close manual recording session',
		defaultLocalShortcut: 'shift+c',
	},
	{ id: 'pushToTalk', description: 'push to talk', defaultLocalShortcut: 'p' },
	{
		id: 'toggleVadRecording',
		description: 'toggle vad recording',
		defaultLocalShortcut: 'v',
	},
] as const;

export type Command = (typeof commands)[number];
