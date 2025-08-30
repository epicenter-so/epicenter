import type { TRANSCRIPTION_SERVICE_IDS } from '$lib/constants/transcription';
import type { Result } from 'wellcrafted/result';

import { createTaggedError } from 'wellcrafted/error';

const { AnalyticsServiceErr, AnalyticsServiceError } = createTaggedError(
	'AnalyticsServiceError',
);
/**
 * Analytics service interface that provides utilities for event logging.
 * Both desktop and web implementations must conform to this interface.
 */
export type AnalyticsService = {
	/**
	 * Send an event to the analytics provider.
	 * Events are typed and validated at compile time.
	 */
	logEvent: (event: Event) => Promise<Result<void, AnalyticsServiceError>>;
};
export { AnalyticsServiceErr, AnalyticsServiceError };

/**
 * Discriminated union of all loggable events.
 * Each event has a 'type' field and optional additional properties.
 * No personal data or user-generated content is ever collected.
 */
export type Event =
	// Application lifecycle
	| { blob_size: number; duration?: number; type: 'manual_recording_completed'; }
	// Recording completion events - always include blob_size, duration when available
	| { blob_size: number; duration?: number; type: 'vad_recording_completed'; }
	| { blob_size: number; type: 'file_uploaded'; }
	| {
			duration: number;
			provider: TranscriptionServiceId;
			type: 'transcription_completed';
	  }
	// Transcription events
	| {
			error_description?: string;
			error_title: string;
			provider: TranscriptionServiceId;
			type: 'transcription_failed';
	  }
	| { provider: TranscriptionServiceId; type: 'transcription_requested'; }
	| { section: SettingsSection; type: 'settings_changed'; }
	// Settings events
	| { type: 'app_started' };

type AnalyticsServiceError = ReturnType<typeof AnalyticsServiceError>;

// Settings sections that can be logged
type SettingsSection =
	| 'analytics'
	| 'appearance'
	| 'audio'
	| 'recording'
	| 'shortcuts'
	| 'transcription';

// Use the TranscriptionServiceId type directly
type TranscriptionServiceId = (typeof TRANSCRIPTION_SERVICE_IDS)[number];