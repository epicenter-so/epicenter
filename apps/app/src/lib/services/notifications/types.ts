import type { Result } from 'wellcrafted/result';
import type { TaggedError } from 'wellcrafted/error';

export type NotificationServiceError = TaggedError<'NotificationServiceError'>;

/**
 * Link action for internal navigation
 * @note The href must be a local path within the app, not an external URL
 */
type LinkAction = {
	type: 'link';
	label: string;
	href: `/${string}`; // Must be a local path like '/settings' or '/recordings/123'
};

/**
 * Button action for custom callbacks
 */
type ButtonAction = {
	type: 'button';
	label: string;
	onClick: () => void | Promise<void>;
};

/**
 * More details action for showing additional information (e.g., error details)
 */
type MoreDetailsAction = {
	type: 'more-details';
	error: unknown; // Can be Error object or any error data
};

export type NotificationAction = LinkAction | ButtonAction | MoreDetailsAction;

export type UnifiedNotificationOptions = {
	/**
	 * Unique identifier
	 * @toast Maps to ExternalToast.id
	 * @browser Maps to tag
	 * @extension Used as notificationId
	 * @tauri Maps to Options.id (as number)
	 */
	id?: string;

	/**
	 * Main notification title
	 * @all Supported on all platforms
	 */
	title: string;

	/**
	 * Notification body text
	 * @toast Maps to ExternalToast.description
	 * @browser Maps to body
	 * @extension Maps to message
	 * @tauri Maps to Options.body
	 */
	description: string;

	/**
	 * Notification icon
	 * @toast Not used (uses variant styling)
	 * @browser Maps to icon
	 * @extension Maps to iconUrl
	 * @tauri Maps to Options.icon
	 */
	icon?: string;

	/**
	 * Keep notification visible until dismissed
	 * @toast Not applicable
	 * @browser Maps to requireInteraction
	 * @extension Maps to requireInteraction
	 * @tauri Maps to Options.autoCancel (inverse)
	 */
	requireInteraction?: boolean;

	/**
	 * Silent notification (no sound)
	 * @toast Not applicable
	 * @browser Maps to silent
	 * @extension Maps via priority: -2
	 * @tauri Maps to Options.silent
	 */
	silent?: boolean;

	/**
	 * Interactive action
	 * @toast Full support via ExternalToast.action (single action only)
	 * @browser Maps to actions[0] (Service Worker only)
	 * @extension Maps to buttons[0]
	 * @tauri Not supported on desktop
	 */
	action?: NotificationAction;

	/**
	 * Toast-specific variant
	 * @toast Maps to type via toast[variant]() methods
	 * @others Ignored
	 */
	variant: 'success' | 'error' | 'warning' | 'info' | 'loading';
};

export type NotificationService = {
	notify: (
		options: UnifiedNotificationOptions,
	) => Promise<Result<string, NotificationServiceError>>;
	clear: (id: string) => Promise<Result<void, NotificationServiceError>>;
};
