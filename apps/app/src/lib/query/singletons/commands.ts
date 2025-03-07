import type { CommandName } from '@repo/shared/settings';
import { getContext, setContext } from 'svelte';
import type { Recorder } from './recorder';
import type { Transcriber } from './transcriber';
import type { Transformer } from './transformer';
import type { VadRecorder } from './vadRecorder';

type Commands = ReturnType<typeof createCommands>;

export const initCommandsInContext = ({
	recorder,
	vadRecorder,
	transcriber,
	transformer,
}: {
	recorder: Recorder;
	vadRecorder: VadRecorder;
	transcriber: Transcriber;
	transformer: Transformer;
}) => {
	const commands = createCommands({
		recorder,
		vadRecorder,
		transcriber,
		transformer,
	});
	setContext('commands', commands);
	return commands;
};

export const getCommandsFromContext = () => {
	return getContext<Commands>('commands');
};

function createCommands({
	recorder,
	vadRecorder,
	transcriber,
	transformer,
}: {
	recorder: Recorder;
	vadRecorder: VadRecorder;
	transcriber: Transcriber;
	transformer: Transformer;
}) {
	return {
		toggleManualRecording: () => recorder.toggleRecording(),
		cancelManualRecording: () => recorder.cancelRecorderWithToast(),
		closeRecordingSession: () => recorder.closeRecordingSessionWithToast(),
		toggleVadRecording: () => vadRecorder.toggleVad(),
		pushToTalk: () => {},
	} satisfies Record<CommandName, () => void>;
}
