import type { Recording, Transformation, TransformationRun } from './models';

export type RecordingsDbSchemaV5 = {
	recordings: Omit<Recording, 'blob'> & {
		serializedAudio: { arrayBuffer: ArrayBuffer; blobType: string } | undefined;
	};
	transformations: Transformation;
	transformationRuns: TransformationRun;
};

export type RecordingsDbSchemaV4 = {
	recordings: Recording;
	transformations: Transformation;
	transformationRuns: TransformationRun;
};

export type RecordingsDbSchemaV3 = {
	recordings: RecordingsDbSchemaV1['recordings'];
};

export type RecordingsDbSchemaV2 = {
	recordingMetadata: Omit<RecordingsDbSchemaV1['recordings'], 'blob'>;
	recordingBlobs: { id: string; blob: Blob | undefined };
};

export type RecordingsDbSchemaV1 = {
	recordings: {
		id: string;
		title: string;
		subtitle: string;
		timestamp: string;
		transcribedText: string;
		blob: Blob | undefined;
		/**
		 * A recording
		 * 1. Begins in an 'UNPROCESSED' state
		 * 2. Moves to 'TRANSCRIBING' while the audio is being transcribed
		 * 3. Finally is marked as 'DONE' when the transcription is complete.
		 * 4. If the transcription fails, it is marked as 'FAILED'
		 */
		transcriptionStatus: 'UNPROCESSED' | 'TRANSCRIBING' | 'DONE' | 'FAILED';
	};
};
