import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Err, Ok, tryAsync } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingRecordingState, WhisperingResult } from '@repo/shared';
import { WhisperingError } from '@repo/shared';
import { whisperingStorage } from '~lib/storage';

const iconPaths = {
	IDLE: studioMicrophone,
	SESSION: studioMicrophone,
	'SESSION+RECORDING': redLargeSquare,
} as const satisfies Record<WhisperingRecordingState, string>;

export type SetRecorderStateMessage = {
	recorderState: WhisperingRecordingState;
};

export type SetRecorderStateResult = WhisperingResult<undefined>;

const setRecorderState = async (recorderState: WhisperingRecordingState) => {
	whisperingStorage.setRecorderState(recorderState);
	const path = iconPaths[recorderState];
	const { error: setIconError } = await tryAsync({
		try: () => chrome.action.setIcon({ path }),
		mapErr: (error) =>
			WhisperingError({
				title: `Error setting icon to ${recorderState} icon`,
				description:
					"There was an error setting the tray icon using the browser's action API. Please try again.",
				action: { type: 'more-details', error },
			}),
	});
	if (setIconError) return Err(setIconError);
	return Ok(undefined);
};

const handler: PlasmoMessaging.MessageHandler<
	SetRecorderStateMessage,
	SetRecorderStateResult
> = async ({ body }, res) => {
	if (!body?.recorderState) {
		res.send(
			Err(
				WhisperingError({
					title: 'Error invoking setRecorderState command',
					description:
						'RecorderState must be provided in the request body of the message',
				}),
			),
		);
		return;
	}
	res.send(await setRecorderState(body.recorderState));
};

export default handler;
