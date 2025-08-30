import { AnalyticsServiceLive } from './analytics';
import * as completions from './completion';
import { DbServiceLive } from './db';
import { DownloadServiceLive } from './download';
import { FfmpegServiceLive } from './ffmpeg';
import { GlobalShortcutManagerLive } from './global-shortcut-manager';
import { LocalShortcutManagerLive } from './local-shortcut-manager';
import { NotificationServiceLive } from './notifications';
import { OsServiceLive } from './os';
import { PermissionsServiceLive } from './permissions';
import {
	BrowserRecorderServiceLive,
	NativeRecorderServiceLive,
} from './recorder';
import { PlaySoundServiceLive } from './sound';
import { TextServiceLive } from './text';
import { ToastServiceLive } from './toast';
import * as transcriptions from './transcription';
import { TrayIconServiceLive } from './tray';
import { VadServiceLive } from './vad-recorder';

/**
 * Unified services object providing consistent access to all services.
 */
export {
	AnalyticsServiceLive as analytics,
	BrowserRecorderServiceLive as browserRecorder,
	completions,
	DbServiceLive as db,
	DownloadServiceLive as download,
	FfmpegServiceLive as ffmpeg,
	GlobalShortcutManagerLive as globalShortcutManager,
	LocalShortcutManagerLive as localShortcutManager,
	NativeRecorderServiceLive as nativeRecorder,
	NotificationServiceLive as notification,
	OsServiceLive as os,
	PermissionsServiceLive as permissions,
	PlaySoundServiceLive as sound,
	TextServiceLive as text,
	ToastServiceLive as toast,
	transcriptions,
	TrayIconServiceLive as tray,
	VadServiceLive as vad,
};
