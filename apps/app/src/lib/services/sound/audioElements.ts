import type { WhisperingSoundNames } from '@repo/shared';
import stopManualSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import captureVadSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startManualSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import stopVadSoudnSrc from './assets/zapsplat_household_alarm_clock_large_snooze_button_press_001_12968.mp3';
import startVadSoundSrc from './assets/zapsplat_household_alarm_clock_large_snooze_button_press_002_12969.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import transformationCompleteSoundSrc from './assets/zapsplat_multimedia_notification_alert_ping_bright_chime_001_93276.mp3';
import transcriptionCompleteSoundSrc from './assets/zapsplat_multimedia_ui_notification_classic_bell_synth_success_107505.mp3';

export const audioElements = {
	'start-manual': new Audio(startManualSoundSrc),
	'cancel-manual': new Audio(cancelSoundSrc),
	'stop-manual': new Audio(stopManualSoundSrc),
	'start-vad': new Audio(startVadSoundSrc),
	'capture-vad': new Audio(captureVadSoundSrc),
	'stop-vad': new Audio(stopVadSoudnSrc),
	transcriptionComplete: new Audio(transcriptionCompleteSoundSrc),
	transformationComplete: new Audio(transformationCompleteSoundSrc),
} satisfies Record<WhisperingSoundNames, HTMLAudioElement>;
