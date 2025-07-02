import { TrayIconServiceLive } from './tray';
import { ClipboardServiceLive } from './clipboard';
import * as completions from './completion';
import { CpalRecorderServiceLive } from './cpal-recorder';
import { DbServiceLive } from './db';
import { DownloadServiceLive } from './download';
import { GlobalShortcutManagerLive } from './global-shortcut-manager';
import { LocalShortcutManagerLive } from './local-shortcut-manager';
import { NavigatorRecorderServiceLive } from './manual-recorder';
import { NotificationServiceLive } from './notifications';
import { OsServiceLive } from './os';
import { PlaySoundServiceLive } from './sound';
import * as transcriptions from './transcription';
import { VadServiceLive } from './vad';

/**
 * Unified services object providing consistent access to all services.
 */
export {
	ClipboardServiceLive as clipboard,
	completions,
	CpalRecorderServiceLive as cpalRecorder,
	TrayIconServiceLive as tray,
	DbServiceLive as db,
	DownloadServiceLive as download,
	GlobalShortcutManagerLive as globalShortcutManager,
	LocalShortcutManagerLive as localShortcutManager,
	NavigatorRecorderServiceLive as manualRecorder,
	NotificationServiceLive as notification,
	OsServiceLive as os,
	PlaySoundServiceLive as sound,
	transcriptions,
	VadServiceLive as vad,
};
