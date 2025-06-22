import { SetTrayIconServiceLive } from './SetTrayIconService';
import { ClipboardServiceLive } from './clipboard';
import { CpalRecorderServiceLive } from './cpalRecorder';
import { DbServiceLive } from './db';
import { DownloadServiceLive } from './download';
import { GlobalShortcutManagerLive } from './global-shortcut-manager';
import { LocalShortcutManagerLive } from './local-shortcut-manager';
import { NavigatorRecorderServiceLive } from './manualRecorder';
import { NotificationServiceLive } from './notifications';
import { OsServiceLive } from './os';
import { PlaySoundServiceLive } from './sound';
import { TranscriptionServiceLive } from './transcription';
import { TransformerServiceLive } from './transformer';
import { VadServiceLive } from './vad';

/**
 * Unified services object providing consistent access to all services.
 */
export {
	ClipboardServiceLive as clipboard,
	CpalRecorderServiceLive as cpalRecorder,
	DbServiceLive as db,
	DownloadServiceLive as download,
	GlobalShortcutManagerLive as globalShortcutManager,
	LocalShortcutManagerLive as localShortcutManager,
	NavigatorRecorderServiceLive as manualRecorder,
	NotificationServiceLive as notification,
	OsServiceLive as os,
	SetTrayIconServiceLive as setTrayIcon,
	PlaySoundServiceLive as sound,
	TranscriptionServiceLive as transcription,
	TransformerServiceLive as transformer,
	VadServiceLive as vad,
};
