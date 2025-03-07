import type { CommandName } from '@repo/shared/settings';
import { getContext, setContext } from 'svelte';
import type { ManualRecorder } from './manualRecorder';
import type { Transcriber } from './transcriber';
import type { Transformer } from './transformer';
import type { VadRecorder } from './vadRecorder';

export type Commands = ReturnType<typeof createCommands>;

export const initCommandsInContext = ({
	recorder,
	vadRecorder,
	transcriber,
	transformer,
}: {
	recorder: ManualRecorder;
	vadRecorder: VadRecorder;
	transcriber: Transcriber;
	transformer: Transformer;
}) => {
	const commands = createCommands({
		manualRecorder: recorder,
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
	manualRecorder,
	vadRecorder,
	transcriber,
	transformer,
}: {
	manualRecorder: ManualRecorder;
	vadRecorder: VadRecorder;
	transcriber: Transcriber;
	transformer: Transformer;
}) {
	return {
		toggleManualRecording: () => manualRecorder.toggleRecording(),
		cancelManualRecording: () => manualRecorder.cancelRecorderWithToast(),
		closeManualRecordingSession: () =>
			manualRecorder.closeRecordingSessionWithToast(),
		toggleVadRecording: () => vadRecorder.toggleVad(),
		pushToTalk: () => {},
	} satisfies Record<CommandName, () => void>;
}
