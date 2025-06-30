import { Err, Ok, tryAsync, trySync } from '@epicenterhq/result';
import type { VadState } from '$lib/constants';
import { WhisperingError } from '$lib/result';
import { MicVAD, utils } from '@ricky0123/vad-web';

export function createVadServiceWeb() {
	let maybeVad: MicVAD | null = null;
	let vadState: VadState = 'IDLE';

	return {
		getVadState: (): VadState => {
			return vadState;
		},

		startActiveListening: async ({
			onSpeechStart,
			onSpeechEnd,
			deviceId,
		}: {
			onSpeechStart: () => void;
			onSpeechEnd: (blob: Blob) => void;
			deviceId: string | null;
		}) => {
			// Initialize VAD if not already initialized
			if (!maybeVad) {
				const { data: newVad, error: initializeVadError } = await tryAsync({
					try: () =>
						MicVAD.new({
							additionalAudioConstraints: deviceId ? { deviceId } : undefined,
							submitUserSpeechOnPause: true,
							onSpeechStart: () => {
								vadState = 'SPEECH_DETECTED';
								onSpeechStart();
							},
							onSpeechEnd: (audio) => {
								vadState = 'LISTENING';
								const wavBuffer = utils.encodeWAV(audio);
								const blob = new Blob([wavBuffer], { type: 'audio/wav' });
								onSpeechEnd(blob);
							},
							onVADMisfire: () => {
								console.log('VAD misfire');
							},
							model: 'v5',
						}),
					mapError: (error) => ({
						name: 'WhisperingError',
						title: '❌ Failed to start voice activated capture',
						description: 'Your voice activated capture could not be started.',
					}),
				});
				if (initializeVadError) return Err(initializeVadError);
				maybeVad = newVad;
			}

			// Start listening
			const vad = maybeVad;
			const { error: startError } = trySync({
				try: () => vad.start(),
				mapError: (error) =>
					WhisperingError({
						title: 'Failed to start Voice Activity Detector',
						description:
							error instanceof Error
								? error.message
								: 'An unknown error occurred while starting the VAD.',
					}),
			});
			if (startError) return Err(startError);
			vadState = 'LISTENING';
			return Ok(undefined);
		},

		stopActiveListening: async () => {
			if (!maybeVad) return Ok(undefined);

			const vad = maybeVad;
			const { error: destroyError } = trySync({
				try: () => vad.destroy(),
				mapError: (error) =>
					WhisperingError({
						title: 'Failed to stop Voice Activity Detector',
						description:
							error instanceof Error ? error.message : 'Failed to stop VAD',
					}),
			});
			if (destroyError) return Err(destroyError);

			maybeVad = null;
			vadState = 'IDLE';
			return Ok(undefined);
		},
	};
}

export const VadServiceLive = createVadServiceWeb();
