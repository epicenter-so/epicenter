/**
 * Media constraints for audio recording
 */

export const TIMESLICE_MS = 1000;

/**
 * Whisper API recommended media track constraints
 * Mono channel at 16kHz for optimal transcription
 */
export const WHISPER_RECOMMENDED_MEDIA_TRACK_CONSTRAINTS = {
	channelCount: { ideal: 1 },
	sampleRate: { ideal: 16_000 },
} satisfies MediaTrackConstraints;
