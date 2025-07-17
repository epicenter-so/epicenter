import { createNotificationServiceDesktop } from './desktop';
import { createNotificationServiceWeb } from './web';

export type { NotificationService, NotificationServiceError } from './types';

/**
 * Low-level notification service for OS-level notifications
 *
 * This service provides platform-specific implementations for showing
 * native system notifications (desktop notifications on Tauri, browser
 * Notification API on web).
 *
 * ## Architecture Note
 *
 * This is a **service-layer** component that handles the technical details
 * of platform-specific notification APIs. Most application code should NOT
 * use this directly. Instead, use the higher-level `notify` API from the
 * query layer:
 *
 * ```typescript
 * // ❌ Don't use this service directly
 * import { NotificationServiceLive } from '$lib/services/notifications';
 * await NotificationServiceLive.notify({ title: 'Hello' });
 *
 * // ✅ Use the notify API instead
 * import { notify } from '$lib/query';
 * await notify.success.execute({ title: 'Hello' });
 * ```
 *
 * ## Why use `notify` instead?
 *
 * The `notify` API in the query layer:
 * - Shows BOTH toast (in-app) AND OS notifications
 * - Provides better error handling and logging
 * - Offers a cleaner API with variant methods
 * - Handles special cases (e.g., no OS notifications for loading states)
 *
 * ## Platform Detection
 *
 * Automatically selects the appropriate implementation:
 * - Desktop (Tauri): Uses native OS notifications via Tauri plugin
 * - Web: Uses browser Notification API with permission handling
 */
export const NotificationServiceLive = window.__TAURI_INTERNALS__
	? createNotificationServiceDesktop()
	: createNotificationServiceWeb();
