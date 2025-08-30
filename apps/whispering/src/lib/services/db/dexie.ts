import type { DownloadService } from '$lib/services/download';
import type { Settings } from '$lib/settings';

import { moreDetailsDialog } from '$lib/components/MoreDetailsDialog.svelte';
import { rpc } from '$lib/query';
import Dexie, { type Transaction } from 'dexie';
import { nanoid } from 'nanoid/non-secure';
import { createTaggedError, extractErrorMessage } from 'wellcrafted/error';
import { Err, Ok, type Result, tryAsync } from 'wellcrafted/result';

import type {
	Recording,
	RecordingsDbSchemaV1,
	RecordingsDbSchemaV2,
	RecordingsDbSchemaV3,
	RecordingsDbSchemaV4,
	RecordingsDbSchemaV5,
	Transformation,
	TransformationRun,
	TransformationRunCompleted,
	TransformationRunFailed,
	TransformationRunRunning,
	TransformationStepRun,
	TransformationStepRunCompleted,
	TransformationStepRunFailed,
	TransformationStepRunRunning,
} from './models';

export const { DbServiceErr, DbServiceError } =
	createTaggedError('DbServiceError');
export type DbServiceError = ReturnType<typeof DbServiceError>;

const DB_NAME = 'RecordingDB';

class WhisperingDatabase extends Dexie {
	recordings!: Dexie.Table<RecordingsDbSchemaV5['recordings'], string>;
	transformationRuns!: Dexie.Table<TransformationRun, string>;
	transformations!: Dexie.Table<Transformation, string>;

	constructor({ DownloadService }: { DownloadService: DownloadService }) {
		super(DB_NAME);

		const wrapUpgradeWithErrorHandling = async ({
			tx,
			upgrade,
			version,
		}: {
			tx: Transaction;
			upgrade: (tx: Transaction) => Promise<void>;
			version: number;
		}) => {
			try {
				await upgrade(tx);
			} catch (error) {
				const DUMP_TABLE_NAMES = [
					'recordings',
					'recordingMetadata',
					'recordingBlobs',
				] as const;

				const dumpTable = async (tableName: string) => {
					try {
						const contents = await tx.table(tableName).toArray();
						return contents;
					} catch (error) {
						return [];
					}
				};

				const dumps = await Dexie.waitFor(
					Promise.all(DUMP_TABLE_NAMES.map((name) => dumpTable(name))),
				);

				const dumpState = {
					tables: Object.fromEntries(
						DUMP_TABLE_NAMES.map((name, i) => [name, dumps[i]]),
					),
					version,
				};

				const dumpString = JSON.stringify(dumpState, null, 2);

				moreDetailsDialog.open({
					title: `Failed to upgrade IndexedDb Database to version ${version}`,
					description:
						'Please download the database dump and delete the database to start fresh.',
					buttons: [
						{
							label: 'Download Database Dump',
							onClick: async () => {
								const blob = new Blob([dumpString], {
									type: 'application/json',
								});
								const { error: downloadError } =
									await DownloadService.downloadBlob({
										blob,
										name: 'recording-db-dump.json',
									});
								if (downloadError) {
									rpc.notify.error.execute({
										title: 'Failed to download IndexedDB dump!',
										description: 'Your IndexedDB dump could not be downloaded.',
										action: { error: downloadError, type: 'more-details' },
									});
								} else {
									rpc.notify.success.execute({
										title: 'IndexedDB dump downloaded!',
										description: 'Your IndexedDB dump is being downloaded.',
									});
								}
							},
						},
						{
							label: 'Delete Database and Reload',
							onClick: async () => {
								try {
									// Delete the database
									await this.delete();
									rpc.notify.success.execute({
										title: 'Database Deleted',
										description:
											'The database has been successfully deleted. Please refresh the page.',
										action: {
											label: 'Refresh',
											onClick: () => {
												window.location.reload();
											},
											type: 'button',
										},
									});
								} catch (err) {
									const error = extractErrorMessage(err);

									rpc.notify.error.execute({
										title: 'Failed to Delete Database',
										description:
											'There was an error deleting the database. Please try again.',
										action: {
											error,
											type: 'more-details',
										},
									});
								}
							},
							variant: 'destructive',
						},
					],
					content: dumpString,
				});

				throw error; // Re-throw to trigger rollback
			}
		};

		// V1: Single recordings table
		this.version(0.1).stores({ recordings: '&id, timestamp' });

		// V2: Split into metadata and blobs
		this.version(0.2)
			.stores({
				recordingBlobs: '&id',
				recordingMetadata: '&id',
				recordings: null,
			})
			.upgrade(async (tx) => {
				await wrapUpgradeWithErrorHandling({
					tx,
					upgrade: async (tx) => {
						// Migrate data from recordings to split tables
						const oldRecordings = await tx
							.table<RecordingsDbSchemaV1['recordings']>('recordings')
							.toArray();

						// Create entries in both new tables
						const metadata = oldRecordings.map(
							({ blob, ...recording }) => recording,
						);
						const blobs = oldRecordings.map(({ blob, id }) => ({ blob, id }));

						await tx
							.table<RecordingsDbSchemaV2['recordingMetadata']>(
								'recordingMetadata',
							)
							.bulkAdd(metadata);
						await tx
							.table<RecordingsDbSchemaV2['recordingBlobs']>('recordingBlobs')
							.bulkAdd(blobs);
					},
					version: 0.2,
				});
			});

		// V3: Back to single recordings table
		this.version(0.3)
			.stores({
				recordingBlobs: null,
				recordingMetadata: null,
				recordings: '&id, timestamp',
			})
			.upgrade(async (tx) => {
				await wrapUpgradeWithErrorHandling({
					tx,
					upgrade: async (tx) => {
						// Get data from both tables
						const metadata = await tx
							.table<RecordingsDbSchemaV2['recordingMetadata']>(
								'recordingMetadata',
							)
							.toArray();
						const blobs = await tx
							.table<RecordingsDbSchemaV2['recordingBlobs']>('recordingBlobs')
							.toArray();

						// Combine and migrate the data
						const mergedRecordings = metadata.map((record) => {
							const blob = blobs.find((b) => b.id === record.id)?.blob;
							return { ...record, blob };
						});

						await tx
							.table<RecordingsDbSchemaV3['recordings']>('recordings')
							.bulkAdd(mergedRecordings);
					},
					version: 0.3,
				});
			});

		// V4: Add transformations, transformation runs, and recording
		// Also migrate recordings timestamp to createdAt and updatedAt
		this.version(0.4)
			.stores({
				recordings: '&id, timestamp, createdAt, updatedAt',
				transformationRuns: '&id, transformationId, recordingId, startedAt',
				transformations: '&id, createdAt, updatedAt',
			})
			.upgrade(async (tx) => {
				await wrapUpgradeWithErrorHandling({
					tx,
					upgrade: async (tx) => {
						const oldRecordings = await tx
							.table<RecordingsDbSchemaV3['recordings']>('recordings')
							.toArray();

						const newRecordings = oldRecordings.map((record) => ({
							...record,
							createdAt: record.timestamp,
							updatedAt: record.timestamp,
						}));

						await tx.table('recordings').clear();
						await tx.table('recordings').bulkAdd(newRecordings);
					},
					version: 0.4,
				});
			});

		// V5: Save recording blob as ArrayBuffer
		this.version(0.5)
			.stores({
				recordings: '&id, timestamp, createdAt, updatedAt',
				transformationRuns: '&id, transformationId, recordingId, startedAt',
				transformations: '&id, createdAt, updatedAt',
			})
			.upgrade(async (tx) => {
				await wrapUpgradeWithErrorHandling({
					tx,
					upgrade: async (tx) => {
						const oldRecordings = await tx
							.table<RecordingsDbSchemaV4['recordings']>('recordings')
							.toArray();

						const newRecordings = await Dexie.waitFor(
							Promise.all(
								oldRecordings.map(async (record) => {
									const recordingWithSerializedAudio =
										await recordingToRecordingWithSerializedAudio(record);
									return recordingWithSerializedAudio;
								}),
							),
						);

						await Dexie.waitFor(tx.table('recordings').clear());
						await Dexie.waitFor(tx.table('recordings').bulkAdd(newRecordings));
					},
					version: 0.5,
				});
			});

		// V6: Change the "subtitle" field to "description"
		// this.version(5)
		// 	.stores({
		// 		recordings: '&id, timestamp, createdAt, updatedAt',
		// 		transformations: '&id, createdAt, updatedAt',
		// 		transformationRuns: '&id, recordingId, startedAt',
		// 	})
		// 	.upgrade(async (tx) => {
		// 		const oldRecordings = await tx
		// 			.table<RecordingsDbSchemaV5['recordings']>('recordings')
		// 			.toArray();

		// 		const newRecordings = oldRecordings.map(
		// 			({ subtitle, ...recording }) => ({
		// 				...recording,
		// 				description: subtitle,
		// 			}),
		// 		);

		// 		await tx.table('recordings').bulkAdd(newRecordings);
		// 	});
	}
}

// const downloadIndexedDbBlobWithToast = useDownloadIndexedDbBlobWithToast();

const recordingToRecordingWithSerializedAudio = async (
	recording: Recording,
): Promise<RecordingsDbSchemaV5['recordings']> => {
	const { blob, ...rest } = recording;
	if (!blob) return { ...rest, serializedAudio: undefined };

	const arrayBuffer = await blob.arrayBuffer().catch((error) => {
		console.error('Error getting array buffer from blob', blob, error);
		return undefined;
	});
	if (!arrayBuffer) return { ...rest, serializedAudio: undefined };

	return { ...rest, serializedAudio: { arrayBuffer, blobType: blob.type } };
};

const recordingWithSerializedAudioToRecording = (
	recording: RecordingsDbSchemaV5['recordings'],
): Recording => {
	const { serializedAudio, ...rest } = recording;
	if (!serializedAudio) return { ...rest, blob: undefined };

	const { arrayBuffer, blobType } = serializedAudio;

	const blob = new Blob([arrayBuffer], { type: blobType });

	return { ...rest, blob };
};

export type DbService = ReturnType<typeof createDbServiceDexie>;

export function createDbServiceDexie({
	DownloadService,
}: {
	DownloadService: DownloadService;
}) {
	const db = new WhisperingDatabase({ DownloadService });
	return {
		async addTransformationStep({
			run,
			step,
		}: {
			run: TransformationRun;
			step: {
				id: string;
				input: string;
			};
		}): Promise<Result<TransformationStepRun, DbServiceError>> {
			const now = new Date().toISOString();
			const newTransformationStepRun = {
				completedAt: null,
				id: nanoid(),
				input: step.input,
				startedAt: now,
				status: 'running',
				stepId: step.id,
			} satisfies TransformationStepRunRunning;

			const updatedRun: TransformationRun = {
				...run,
				stepRuns: [...run.stepRuns, newTransformationStepRun],
			};

			const { error: addStepRunToTransformationRunError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { run, step },
						message: 'Error adding step run to transformation run in Dexie',
					}),
				try: () => db.transformationRuns.put(updatedRun),
			});
			if (addStepRunToTransformationRunError)
				return Err(addStepRunToTransformationRunError);

			return Ok(newTransformationStepRun);
		},

		/**
		 * Checks and deletes expired recordings based on current settings.
		 * This should be called:
		 * 1. On initial load
		 * 2. Before adding new recordings
		 * 3. When retention settings change
		 */
		async cleanupExpiredRecordings({
			maxRecordingCount,
			recordingRetentionStrategy,
		}: {
			maxRecordingCount: Settings['database.maxRecordingCount'];
			recordingRetentionStrategy: Settings['database.recordingRetentionStrategy'];
		}): Promise<Result<void, DbServiceError>> {
			switch (recordingRetentionStrategy) {
				case 'keep-forever': {
					return Ok(undefined);
				}
				case 'limit-count': {
					const { data: count, error: countError } = await tryAsync({
						mapErr: (error) =>
							DbServiceErr({
								cause: error,
								context: { maxRecordingCount, recordingRetentionStrategy },
								message:
									'Unable to get recording count while cleaning up old recordings',
							}),
						try: () => db.recordings.count(),
					});
					if (countError) return Err(countError);
					if (count === 0) return Ok(undefined);

					const maxCount = Number.parseInt(maxRecordingCount);

					if (count <= maxCount) return Ok(undefined);

					return tryAsync({
						mapErr: (error) =>
							DbServiceErr({
								cause: error,
								context: { count, maxCount, recordingRetentionStrategy },
								message: 'Unable to clean up old recordings',
							}),
						try: async () => {
							const idsToDelete = await db.recordings
								.orderBy('createdAt')
								.limit(count - maxCount)
								.primaryKeys();
							await db.recordings.bulkDelete(idsToDelete);
						},
					});
				}
			}
		},

		async completeTransformation({
			output,
			run,
		}: {
			output: string;
			run: TransformationRun;
		}): Promise<Result<TransformationRunCompleted, DbServiceError>> {
			const now = new Date().toISOString();

			// Create the completed transformation run
			const completedRun: TransformationRunCompleted = {
				...run,
				completedAt: now,
				output,
				status: 'completed',
			};

			const { error: updateTransformationStepRunError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { output, run },
						message: 'Error updating transformation run as completed in Dexie',
					}),
				try: () => db.transformationRuns.put(completedRun),
			});
			if (updateTransformationStepRunError)
				return Err(updateTransformationStepRunError);

			return Ok(completedRun);
		},

		async completeTransformationStepRun({
			output,
			run,
			stepRunId,
		}: {
			output: string;
			run: TransformationRun;
			stepRunId: string;
		}): Promise<Result<TransformationRun, DbServiceError>> {
			const now = new Date().toISOString();

			// Create updated transformation run with the new step runs
			const updatedRun: TransformationRun = {
				...run,
				stepRuns: run.stepRuns.map((stepRun) => {
					if (stepRun.id === stepRunId) {
						const completedStepRun: TransformationStepRunCompleted = {
							...stepRun,
							completedAt: now,
							output,
							status: 'completed',
						};
						return completedStepRun;
					}
					return stepRun;
				}),
			};

			const { error: updateTransformationStepRunError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { output, run, stepId: stepRunId },
						message: 'Error updating transformation step run status in Dexie',
					}),
				try: () => db.transformationRuns.put(updatedRun),
			});
			if (updateTransformationStepRunError)
				return Err(updateTransformationStepRunError);

			return Ok(updatedRun);
		},

		async createRecording(
			recording: Recording,
		): Promise<Result<Recording, DbServiceError>> {
			const now = new Date().toISOString();
			const recordingWithTimestamps = {
				...recording,
				createdAt: now,
				updatedAt: now,
			} satisfies Recording;

			const dbRecording = await recordingToRecordingWithSerializedAudio(
				recordingWithTimestamps,
			);

			const { error: createRecordingError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { recording },
						message: 'Error adding recording to Dexie',
					}),
				try: async () => {
					await db.recordings.add(dbRecording);
				},
			});
			if (createRecordingError) return Err(createRecordingError);
			return Ok(recordingWithTimestamps);
		},

		async createTransformation(
			transformation: Transformation,
		): Promise<Result<Transformation, DbServiceError>> {
			const { error: createTransformationError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { transformation },
						message: 'Error adding transformation to Dexie',
					}),
				try: () => db.transformations.add(transformation),
			});
			if (createTransformationError) return Err(createTransformationError);
			return Ok(transformation);
		},

		async createTransformationRun({
			input,
			recordingId,
			transformationId,
		}: {
			input: string;
			recordingId: null | string;
			transformationId: string;
		}): Promise<Result<TransformationRun, DbServiceError>> {
			const now = new Date().toISOString();
			const transformationRunWithTimestamps = {
				completedAt: null,
				id: nanoid(),
				input,
				recordingId,
				startedAt: now,
				status: 'running',
				stepRuns: [],
				transformationId,
			} satisfies TransformationRunRunning;
			const { error: createTransformationRunError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { input, recordingId, transformationId },
						message: 'Error adding transformation run to Dexie',
					}),
				try: () => db.transformationRuns.add(transformationRunWithTimestamps),
			});
			if (createTransformationRunError)
				return Err(createTransformationRunError);
			return Ok(transformationRunWithTimestamps);
		},

		async deleteRecording(
			recording: Recording,
		): Promise<Result<void, DbServiceError>> {
			const { error: deleteRecordingError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { recording },
						message: 'Error deleting recording from Dexie',
					}),
				try: async () => {
					await db.recordings.delete(recording.id);
				},
			});
			if (deleteRecordingError) return Err(deleteRecordingError);
			return Ok(undefined);
		},

		async deleteRecordings(
			recordingsToDelete: Recording[],
		): Promise<Result<void, DbServiceError>> {
			const ids = recordingsToDelete.map((r) => r.id);
			const { error: deleteRecordingsError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { recordingsToDelete },
						message: 'Error deleting recordings from Dexie',
					}),
				try: () => db.recordings.bulkDelete(ids),
			});
			if (deleteRecordingsError) return Err(deleteRecordingsError);
			return Ok(undefined);
		},
		async deleteTransformation(
			transformation: Transformation,
		): Promise<Result<void, DbServiceError>> {
			const { error: deleteTransformationError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { transformation },
						message: 'Error deleting transformation from Dexie',
					}),
				try: () => db.transformations.delete(transformation.id),
			});
			if (deleteTransformationError) return Err(deleteTransformationError);
			return Ok(undefined);
		},

		async deleteTransformations(
			transformations: Transformation[],
		): Promise<Result<void, DbServiceError>> {
			const ids = transformations.map((t) => t.id);
			const { error: deleteTransformationsError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { transformations },
						message: 'Error deleting transformations from Dexie',
					}),
				try: () => db.transformations.bulkDelete(ids),
			});
			if (deleteTransformationsError) return Err(deleteTransformationsError);
			return Ok(undefined);
		},

		async failTransformationAtStepRun({
			error,
			run,
			stepRunId,
		}: {
			error: string;
			run: TransformationRun;
			stepRunId: string;
		}): Promise<Result<TransformationRunFailed, DbServiceError>> {
			const now = new Date().toISOString();

			// Create the failed transformation run
			const failedRun: TransformationRunFailed = {
				...run,
				completedAt: now,
				error,
				status: 'failed',
				stepRuns: run.stepRuns.map((stepRun) => {
					if (stepRun.id === stepRunId) {
						const failedStepRun: TransformationStepRunFailed = {
							...stepRun,
							completedAt: now,
							error,
							status: 'failed',
						};
						return failedStepRun;
					}
					return stepRun;
				}),
			};

			const { error: updateTransformationStepRunError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { error, run, stepId: stepRunId },
						message: 'Error updating transformation run as failed in Dexie',
					}),
				try: () => db.transformationRuns.put(failedRun),
			});
			if (updateTransformationStepRunError)
				return Err(updateTransformationStepRunError);

			return Ok(failedRun);
		},

		async getAllRecordings(): Promise<Result<Recording[], DbServiceError>> {
			return tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						message: 'Error getting all recordings from Dexie',
					}),
				try: async () => {
					const recordings = await db.recordings
						.orderBy('timestamp')
						.reverse()
						.toArray();
					return Dexie.waitFor(
						Promise.all(
							recordings.map(recordingWithSerializedAudioToRecording),
						),
					);
				},
			});
		},

		async getAllTransformations(): Promise<
			Result<Transformation[], DbServiceError>
		> {
			return tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						message: 'Error getting all transformations from Dexie',
					}),
				try: () => db.transformations.toArray(),
			});
		},

		async getLatestRecording(): Promise<
			Result<null | Recording, DbServiceError>
		> {
			return tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						message: 'Error getting latest recording from Dexie',
					}),
				try: async () => {
					const latestRecording = await db.recordings
						.orderBy('timestamp')
						.reverse()
						.first();
					if (!latestRecording) return null;
					return recordingWithSerializedAudioToRecording(latestRecording);
				},
			});
		},

		async getRecordingById(
			id: string,
		): Promise<Result<null | Recording, DbServiceError>> {
			return tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { id },
						message: 'Error getting recording by id from Dexie',
					}),
				try: async () => {
					const maybeRecording = await db.recordings.get(id);
					if (!maybeRecording) return null;
					return recordingWithSerializedAudioToRecording(maybeRecording);
				},
			});
		},

		async getTranscribingRecordingIds(): Promise<
			Result<string[], DbServiceError>
		> {
			return tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						message: 'Error getting transcribing recording ids from Dexie',
					}),
				try: () =>
					db.recordings
						.where('transcriptionStatus')
						.equals('TRANSCRIBING' satisfies Recording['transcriptionStatus'])
						.primaryKeys(),
			});
		},

		async getTransformationById(
			id: string,
		): Promise<Result<null | Transformation, DbServiceError>> {
			return tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { id },
						message: 'Error getting transformation by id from Dexie',
					}),
				try: async () => {
					const maybeTransformation =
						(await db.transformations.get(id)) ?? null;
					return maybeTransformation;
				},
			});
		},

		async getTransformationRunById(
			id: string,
		): Promise<Result<null | TransformationRun, DbServiceError>> {
			const { data: transformationRun, error: getTransformationRunByIdError } =
				await tryAsync({
					mapErr: (error) =>
						DbServiceErr({
							cause: error,
							context: { id },
							message: 'Error getting transformation run by id from Dexie',
						}),
					try: () => db.transformationRuns.where('id').equals(id).first(),
				});
			if (getTransformationRunByIdError)
				return Err(getTransformationRunByIdError);
			return Ok(transformationRun ?? null);
		},

		async getTransformationRunsByRecordingId(
			recordingId: string,
		): Promise<Result<TransformationRun[], DbServiceError>> {
			return tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { recordingId },
						message:
							'Error getting transformation runs by recording id from Dexie',
					}),
				try: () =>
					db.transformationRuns
						.where('recordingId')
						.equals(recordingId)
						.toArray()
						.then((runs) =>
							runs.sort(
								(a, b) =>
									new Date(b.startedAt).getTime() -
									new Date(a.startedAt).getTime(),
							),
						),
			});
		},

		async getTransformationRunsByTransformationId(
			transformationId: string,
		): Promise<Result<TransformationRun[], DbServiceError>> {
			return tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { transformationId },
						message:
							'Error getting transformation runs by transformation id from Dexie',
					}),
				try: () =>
					db.transformationRuns
						.where('transformationId')
						.equals(transformationId)
						.reverse()
						.toArray()
						.then((runs) =>
							runs.sort(
								(a, b) =>
									new Date(b.startedAt).getTime() -
									new Date(a.startedAt).getTime(),
							),
						),
			});
		},

		async updateRecording(
			recording: Recording,
		): Promise<Result<Recording, DbServiceError>> {
			const now = new Date().toISOString();
			const recordingWithTimestamp = {
				...recording,
				updatedAt: now,
			} satisfies Recording;

			const dbRecording = await recordingToRecordingWithSerializedAudio(
				recordingWithTimestamp,
			);

			const { error: updateRecordingError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { recording },
						message: 'Error updating recording in Dexie',
					}),
				try: async () => {
					await db.recordings.put(dbRecording);
				},
			});
			if (updateRecordingError) return Err(updateRecordingError);
			return Ok(recordingWithTimestamp);
		},

		async updateTransformation(
			transformation: Transformation,
		): Promise<Result<Transformation, DbServiceError>> {
			const now = new Date().toISOString();
			const transformationWithTimestamp = {
				...transformation,
				updatedAt: now,
			} satisfies Transformation;
			const { error: updateTransformationError } = await tryAsync({
				mapErr: (error) =>
					DbServiceErr({
						cause: error,
						context: { transformation },
						message: 'Error updating transformation in Dexie',
					}),
				try: () => db.transformations.put(transformationWithTimestamp),
			});
			if (updateTransformationError) return Err(updateTransformationError);
			return Ok(transformationWithTimestamp);
		},
	};
}
