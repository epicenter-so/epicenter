export type Recording = {
	blob: Blob | undefined;
	createdAt: string;
	id: string;
	subtitle: string;
	timestamp: string;
	title: string;
	transcribedText: string;
	/**
	 * A recording
	 * 1. Begins in an 'UNPROCESSED' state
	 * 2. Moves to 'TRANSCRIBING' while the audio is being transcribed
	 * 3. Finally is marked as 'DONE' when the transcription is complete.
	 * 4. If the transcription fails, it is marked as 'FAILED'
	 */
	transcriptionStatus: 'DONE' | 'FAILED' | 'TRANSCRIBING' | 'UNPROCESSED';
	updatedAt: string;
};

export type RecordingsDbSchemaV1 = {
	recordings: {
		blob: Blob | undefined;
		id: string;
		subtitle: string;
		timestamp: string;
		title: string;
		transcribedText: string;
		/**
		 * A recording
		 * 1. Begins in an 'UNPROCESSED' state
		 * 2. Moves to 'TRANSCRIBING' while the audio is being transcribed
		 * 3. Finally is marked as 'DONE' when the transcription is complete.
		 * 4. If the transcription fails, it is marked as 'FAILED'
		 */
		transcriptionStatus: 'DONE' | 'FAILED' | 'TRANSCRIBING' | 'UNPROCESSED';
	};
};

export type RecordingsDbSchemaV2 = {
	recordingBlobs: { blob: Blob | undefined; id: string; };
	recordingMetadata: Omit<RecordingsDbSchemaV1['recordings'], 'blob'>;
};

export type RecordingsDbSchemaV3 = {
	recordings: RecordingsDbSchemaV1['recordings'];
};

export type RecordingsDbSchemaV4 = {
	recordings: Recording;
};

export type RecordingsDbSchemaV5 = {
	recordings: Omit<Recording, 'blob'> & {
		serializedAudio: undefined | { arrayBuffer: ArrayBuffer; blobType: string };
	};
};
