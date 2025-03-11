import type { Command } from '@repo/shared';
import { getContext, setContext } from 'svelte';
import type { ManualRecorder } from './manualRecorder';
import type { Transcriber } from './transcriber';
import type { Transformer } from './transformer';
import type { VadRecorder } from './vadRecorder';

export type CommandCallbacks = ReturnType<typeof createCommandCallbacks>;

export const initCommandsInContext = ({
	manualRecorder,
	vadRecorder,
	transcriber,
	transformer,
}: {
	manualRecorder: ManualRecorder;
	vadRecorder: VadRecorder;
	transcriber: Transcriber;
	transformer: Transformer;
}) => {
	const commandCallbacks = createCommandCallbacks({
		manualRecorder,
		vadRecorder,
		transcriber,
		transformer,
	});
	setContext('commandCallbacks', commandCallbacks);
	return commandCallbacks;
};

export const getCommandsFromContext = () => {
	return getContext<CommandCallbacks>('commandCallbacks');
};

function createCommandCallbacks({
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
	} satisfies Record<Command['id'], () => void>;
}
