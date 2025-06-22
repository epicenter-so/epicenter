import { createNotificationServiceDesktop } from './desktop';
import { createNotificationServiceWeb } from './web';

export type { NotificationService, NotificationServiceError } from './types';

export const NotificationServiceLive = window.__TAURI_INTERNALS__
	? createNotificationServiceDesktop()
	: createNotificationServiceWeb();
