import { Ok, trySync } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingRecordingState } from '@repo/shared';
import { MicVAD, utils } from '@ricky0123/vad-web';
import { toast } from '../toast';

export function createVadServiceWeb() {
	let maybeVad: MicVAD | null = null;
	let isActivelyListening = false;

	return {
		getVadState: (): WhisperingRecordingState => {
			if (!maybeVad) return 'IDLE';
			if (isActivelyListening) return 'SESSION+RECORDING';
			return 'SESSION';
		},
		ensureVad: async ({
			onSpeechEnd,
			deviceId,
		}: {
			onSpeechEnd: (blob: Blob) => void;
			deviceId: string | null;
		}) => {
			if (maybeVad) return Ok(maybeVad);
			maybeVad = await MicVAD.new({
				additionalAudioConstraints: deviceId ? { deviceId } : undefined,
				submitUserSpeechOnPause: true,
				onSpeechStart: () => {
					toast.success({
						title: '🎙️ Speech started',
						description: 'Recording started. Speak clearly and loudly.',
					});
				},
				onSpeechEnd: (audio) => {
					const wavBuffer = utils.encodeWAV(audio);
					const blob = new Blob([wavBuffer], { type: 'audio/wav' });
					onSpeechEnd(blob);
				},
				onVADMisfire: () => {
					console.log('VAD misfire');
				},
				model: 'v5',
			});
			return Ok(maybeVad);
		},
		closeVad: async () => {
			if (!maybeVad) return Ok(undefined);
			const vad = maybeVad;
			const destroyResult = trySync({
				try: () => vad.destroy(),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Failed to destroy Voice Activity Detector',
						description:
							error instanceof Error ? error.message : 'Failed to destroy VAD',
					}),
			});
			if (!destroyResult.ok) return destroyResult;
			maybeVad = null;
			isActivelyListening = false;
			return Ok(undefined);
		},
		startVad: async () => {
			if (!maybeVad)
				return WhisperingErr({
					title: 'Voice Activity Detector not initialized',
					description:
						'The voice activity detector has not been initialized. Please ensure that the VAD is initialized before starting it.',
				});
			const vad = maybeVad;
			const startResult = trySync({
				try: () => vad.start(),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Failed to start Voice Activity Detector',
						description:
							error instanceof Error
								? error.message
								: 'An unknown error occurred while starting the VAD.',
					}),
			});
			if (!startResult.ok) return startResult;
			isActivelyListening = true;
			return startResult;
		},
		pauseVad: async () => {
			if (!maybeVad)
				return WhisperingErr({
					title: 'Voice Activity Detector not initialized',
					description: 'VAD not initialized',
				});
			const vad = maybeVad;
			const pauseResult = trySync({
				try: () => vad.pause(),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Failed to pause Voice Activity Detector',
						description:
							error instanceof Error
								? error.message
								: 'An unknown error occurred while pausing the VAD.',
					}),
			});
			if (!pauseResult.ok) return pauseResult;
			isActivelyListening = false;
			return pauseResult;
		},
		destroyVad: async () => {
			if (!maybeVad)
				return WhisperingErr({
					title: 'Voice Activity Detector not initialized',
					description: 'VAD not initialized',
				});
			const vad = maybeVad;
			const destroyResult = trySync({
				try: () => vad.destroy(),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Failed to destroy Voice Activity Detector',
						description:
							error instanceof Error
								? error.message
								: 'An unknown error occurred while destroying the VAD.',
					}),
			});
			if (!destroyResult.ok) return destroyResult;
			maybeVad = null;
			isActivelyListening = false;
			return Ok(undefined);
		},
	};
}
