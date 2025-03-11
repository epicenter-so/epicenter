import { moreDetailsDialog } from '$lib/components/MoreDetailsDialog.svelte';
import { useDownloadIndexedDbBlobWithToast } from '$lib/query/download/mutations';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Ok, tryAsync } from '@epicenterhq/result';
import Dexie, { type Transaction } from 'dexie';
import { nanoid } from 'nanoid/non-secure';
import type {
	DbRecordingsService,
	DbTransformationsService,
	Recording,
	Transformation,
	TransformationRun,
	TransformationStepRun,
} from './DbService';
import { DbServiceErr } from './DbService';
import type {
	RecordingsDbSchemaV1,
	RecordingsDbSchemaV2,
	RecordingsDbSchemaV3,
	RecordingsDbSchemaV4,
	RecordingsDbSchemaV5,
} from './DbServiceTypes';

const DB_NAME = 'RecordingDB';

class RecordingsDatabase extends Dexie {
	recordings!: Dexie.Table<RecordingsDbSchemaV5['recordings'], string>;
	transformations!: Dexie.Table<
		RecordingsDbSchemaV5['transformations'],
		string
	>;
	transformationRuns!: Dexie.Table<
		RecordingsDbSchemaV5['transformationRuns'],
		string
	>;

	constructor() {
		super(DB_NAME);

		const wrapUpgradeWithErrorHandling = async ({
			tx,
			version,
			upgrade,
		}: {
			tx: Transaction;
			version: number;
			upgrade: (tx: Transaction) => Promise<void>;
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
					version,
					tables: Object.fromEntries(
						DUMP_TABLE_NAMES.map((name, i) => [name, dumps[i]]),
					),
				};

				const dumpString = JSON.stringify(dumpState, null, 2);

				moreDetailsDialog.open({
					title: `Failed to upgrade IndexedDb Database to version ${version}`,
					description:
						'Please download the database dump and delete the database to start fresh.',
					content: dumpString,
					buttons: [
						{
							label: 'Download Database Dump',
							onClick: () => {
								const { downloadIndexedDbBlobWithToast } =
									useDownloadIndexedDbBlobWithToast();
								const blob = new Blob([dumpString], {
									type: 'application/json',
								});
								downloadIndexedDbBlobWithToast.mutate({
									name: 'recording-db-dump.json',
									blob,
								});
							},
						},
						{
							label: 'Delete Database and Reload',
							variant: 'destructive',
							onClick: async () => {
								try {
									// Delete the database
									await this.delete();
									toast.success({
										title: 'Database Deleted',
										description:
											'The database has been successfully deleted. Please refresh the page.',
										action: {
											type: 'button',
											label: 'Refresh',
											onClick: () => {
												window.location.reload();
											},
										},
									});
								} catch (err) {
									const error =
										err instanceof Error ? err : new Error(String(err));
									toast.error({
										title: 'Failed to Delete Database',
										description:
											'There was an error deleting the database. Please try again.',
										action: {
											type: 'more-details',
											error,
										},
									});
								}
							},
						},
					],
				});

				throw error; // Re-throw to trigger rollback
			}
		};

		// V1: Single recordings table
		this.version(0.1).stores({ recordings: '&id, timestamp' });

		// V2: Split into metadata and blobs
		this.version(0.2)
			.stores({
				recordings: null,
				recordingMetadata: '&id',
				recordingBlobs: '&id',
			})
			.upgrade(async (tx) => {
				await wrapUpgradeWithErrorHandling({
					tx,
					version: 0.2,
					upgrade: async (tx) => {
						// Migrate data from recordings to split tables
						const oldRecordings = await tx
							.table<RecordingsDbSchemaV1['recordings']>('recordings')
							.toArray();

						// Create entries in both new tables
						const metadata = oldRecordings.map(
							({ blob, ...recording }) => recording,
						);
						const blobs = oldRecordings.map(({ id, blob }) => ({ id, blob }));

						await tx
							.table<
								RecordingsDbSchemaV2['recordingMetadata']
							>('recordingMetadata')
							.bulkAdd(metadata);
						await tx
							.table<RecordingsDbSchemaV2['recordingBlobs']>('recordingBlobs')
							.bulkAdd(blobs);
					},
				});
			});

		// V3: Back to single recordings table
		this.version(0.3)
			.stores({
				recordings: '&id, timestamp',
				recordingMetadata: null,
				recordingBlobs: null,
			})
			.upgrade(async (tx) => {
				await wrapUpgradeWithErrorHandling({
					tx,
					version: 0.3,
					upgrade: async (tx) => {
						// Get data from both tables
						const metadata = await tx
							.table<
								RecordingsDbSchemaV2['recordingMetadata']
							>('recordingMetadata')
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
				});
			});

		// V4: Add transformations, transformation runs, and recording
		// Also migrate recordings timestamp to createdAt and updatedAt
		this.version(0.4)
			.stores({
				recordings: '&id, timestamp, createdAt, updatedAt',
				transformations: '&id, createdAt, updatedAt',
				transformationRuns: '&id, transformationId, recordingId, startedAt',
			})
			.upgrade(async (tx) => {
				await wrapUpgradeWithErrorHandling({
					tx,
					version: 0.4,
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
				});
			});

		// V5: Save recording blob as ArrayBuffer
		this.version(0.5)
			.stores({
				recordings: '&id, timestamp, createdAt, updatedAt',
				transformations: '&id, createdAt, updatedAt',
				transformationRuns: '&id, transformationId, recordingId, startedAt',
			})
			.upgrade(async (tx) => {
				await wrapUpgradeWithErrorHandling({
					tx,
					version: 0.5,
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

const db = new RecordingsDatabase();

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

export function createDbRecordingsServiceDexie() {
	return {
		async getAllRecordings() {
			return tryAsync({
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
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error getting all recordings from Dexie',
						error,
					}),
			});
		},

		async getLatestRecording() {
			return tryAsync({
				try: async () => {
					const latestRecording = await db.recordings
						.orderBy('timestamp')
						.reverse()
						.first();
					if (!latestRecording) return null;
					return recordingWithSerializedAudioToRecording(latestRecording);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error getting latest recording from Dexie',
						error,
					}),
			});
		},

		async getTranscribingRecordingIds() {
			return tryAsync({
				try: () =>
					db.recordings
						.where('transcriptionStatus')
						.equals('TRANSCRIBING' satisfies Recording['transcriptionStatus'])
						.primaryKeys(),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error getting transcribing recording ids from Dexie',
						error,
					}),
			});
		},

		async getRecordingById(id: string) {
			return tryAsync({
				try: async () => {
					const maybeRecording = await db.recordings.get(id);
					if (!maybeRecording) return null;
					return recordingWithSerializedAudioToRecording(maybeRecording);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error getting recording by id from Dexie',
						error,
					}),
			});
		},

		async createRecording(recording) {
			const now = new Date().toISOString();
			const recordingWithTimestamps = {
				...recording,
				createdAt: now,
				updatedAt: now,
			} satisfies Recording;

			const dbRecording = await recordingToRecordingWithSerializedAudio(
				recordingWithTimestamps,
			);

			const createRecordingResult = await tryAsync({
				try: async () => {
					await db.recordings.add(dbRecording);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error adding recording to Dexie',
						error,
					}),
			});
			if (!createRecordingResult.ok) return createRecordingResult;
			return Ok(recordingWithTimestamps);
		},

		async updateRecording(recording: Recording) {
			const now = new Date().toISOString();
			const recordingWithTimestamp = {
				...recording,
				updatedAt: now,
			} satisfies Recording;

			const dbRecording = await recordingToRecordingWithSerializedAudio(
				recordingWithTimestamp,
			);

			const updateRecordingResult = await tryAsync({
				try: async () => {
					await db.recordings.put(dbRecording);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error updating recording in Dexie',
						error,
					}),
			});
			if (!updateRecordingResult.ok) return updateRecordingResult;
			return Ok(recordingWithTimestamp);
		},

		async deleteRecording(recording: Recording) {
			const deleteRecordingByIdResult = await tryAsync({
				try: async () => {
					await db.recordings.delete(recording.id);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error deleting recording from Dexie',
						error,
					}),
			});
			if (!deleteRecordingByIdResult.ok) return deleteRecordingByIdResult;
			return Ok(undefined);
		},

		async deleteRecordings(recordingsToDelete: Recording[]) {
			const ids = recordingsToDelete.map((r) => r.id);
			const deleteRecordingsResult = await tryAsync({
				try: () => db.recordings.bulkDelete(ids),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error deleting recordings from Dexie',
						error,
					}),
			});
			if (!deleteRecordingsResult.ok) return deleteRecordingsResult;
			return Ok(undefined);
		},

		async cleanupExpiredRecordings() {
			const recordingRetentionStrategy =
				settings.value['database.recordingRetentionStrategy'];
			const maxRecordingCount = settings.value['database.maxRecordingCount'];
			switch (recordingRetentionStrategy) {
				case 'keep-forever': {
					return Ok(undefined);
				}
				case 'limit-count': {
					const countResult = await tryAsync({
						try: () => db.recordings.count(),
						mapErr: (error) =>
							DbServiceErr({
								title:
									'Unable to get recording count while cleaning up old recordings',
								error,
							}),
					});
					if (!countResult.ok) return countResult;
					const count = countResult.data;
					if (count === 0) return Ok(undefined);

					const maxCount = Number.parseInt(maxRecordingCount);

					if (count <= maxCount) return Ok(undefined);

					return tryAsync({
						try: async () => {
							const idsToDelete = await db.recordings
								.orderBy('createdAt')
								.limit(count - maxCount)
								.primaryKeys();
							await db.recordings.bulkDelete(idsToDelete);
						},
						mapErr: (error) =>
							DbServiceErr({
								title: 'Unable to clean up old recordings',
								error,
							}),
					});
				}
			}
		},
	} satisfies DbRecordingsService;
}

export function createDbTransformationsServiceDexie() {
	return {
		async getAllTransformations() {
			return tryAsync({
				try: () => db.transformations.toArray(),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error getting all transformations from Dexie',
						error,
					}),
			});
		},

		async getTransformationById(id: string) {
			return tryAsync({
				try: async () => {
					const maybeTransformation =
						(await db.transformations.get(id)) ?? null;
					return maybeTransformation;
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error getting transformation by id from Dexie',
						error,
					}),
			});
		},

		async createTransformation(transformation) {
			const now = new Date().toISOString();
			const transformationWithTimestamps = {
				...transformation,
				createdAt: now,
				updatedAt: now,
			} satisfies Transformation;
			const createTransformationResult = await tryAsync({
				try: () => db.transformations.add(transformationWithTimestamps),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error adding transformation to Dexie',
						error,
					}),
			});
			if (!createTransformationResult.ok) return createTransformationResult;
			return Ok(transformationWithTimestamps);
		},

		async updateTransformation(transformation) {
			const now = new Date().toISOString();
			const transformationWithTimestamp = {
				...transformation,
				updatedAt: now,
			} satisfies Transformation;
			const updateTransformationResult = await tryAsync({
				try: () => db.transformations.put(transformationWithTimestamp),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error updating transformation in Dexie',
						error,
					}),
			});
			if (!updateTransformationResult.ok) return updateTransformationResult;
			return Ok(transformationWithTimestamp);
		},

		async deleteTransformation(transformation) {
			const deleteTransformationResult = await tryAsync({
				try: () => db.transformations.delete(transformation.id),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error deleting transformation from Dexie',
						error,
					}),
			});
			if (!deleteTransformationResult.ok) return deleteTransformationResult;
			return Ok(undefined);
		},

		async deleteTransformations(transformations) {
			const ids = transformations.map((t) => t.id);
			const deleteTransformationsResult = await tryAsync({
				try: () => db.transformations.bulkDelete(ids),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error deleting transformations from Dexie',
						error,
					}),
			});
			if (!deleteTransformationsResult.ok) return deleteTransformationsResult;
			return Ok(undefined);
		},

		async getTransformationRunById(id) {
			const result = await tryAsync({
				try: () => db.transformationRuns.where('id').equals(id).first(),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error getting transformation run by id from Dexie',
						error,
					}),
			});
			if (!result.ok) return result;
			return Ok(result.data ?? null);
		},

		async getTransformationRunsByTransformationId(transformationId) {
			return tryAsync({
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
				mapErr: (error) =>
					DbServiceErr({
						title:
							'Error getting transformation runs by transformation id from Dexie',
						error,
					}),
			});
		},

		async getTransformationRunsByRecordingId(recordingId) {
			return tryAsync({
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
				mapErr: (error) =>
					DbServiceErr({
						title:
							'Error getting transformation runs by recording id from Dexie',
						error,
					}),
			});
		},

		async createTransformationRun(transformationRun) {
			const now = new Date().toISOString();
			const transformationRunWithTimestamps = {
				...transformationRun,
				id: nanoid(),
				startedAt: now,
				completedAt: null,
				status: 'running',
				output: null,
				error: null,
				stepRuns: [],
			} satisfies TransformationRun;
			const createTransformationRunResult = await tryAsync({
				try: () => db.transformationRuns.add(transformationRunWithTimestamps),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error adding transformation run to Dexie',
						error,
					}),
			});
			if (!createTransformationRunResult.ok)
				return createTransformationRunResult;
			return Ok(transformationRunWithTimestamps);
		},

		async addTransformationStepRunToTransformationRun({
			transformationRun,
			input,
			stepId,
		}) {
			const now = new Date().toISOString();
			const transformationStepRun = {
				id: nanoid(),
				stepId,
				input,
				startedAt: now,
				completedAt: null,
				status: 'running',
				output: null,
				error: null,
			} satisfies TransformationStepRun;

			const addStepRunToTransformationRun = (
				transformationRun: TransformationRun,
			) => {
				transformationRun.stepRuns.push(transformationStepRun);
			};

			const result = await tryAsync({
				try: () =>
					db.transformationRuns
						.where('id')
						.equals(transformationRun.id)
						.modify(addStepRunToTransformationRun),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error adding step run to transformation run in Dexie',
						error,
					}),
			});
			if (!result.ok) return result;
			addStepRunToTransformationRun(transformationRun);
			return Ok(transformationStepRun);
		},

		async markTransformationRunAndRunStepAsFailed({
			transformationRun,
			stepRunId,
			error,
		}) {
			const markTransformationRunAndRunStepAsFailed = (
				transformationRun: TransformationRun,
			) => {
				const stepRun = transformationRun.stepRuns.find(
					(sr) => sr.id === stepRunId,
				);
				if (!stepRun) return;
				const now = new Date().toISOString();
				stepRun.status = 'failed';
				stepRun.completedAt = now;
				stepRun.error = error;
				transformationRun.status = 'failed';
				transformationRun.completedAt = now;
				transformationRun.error = error;
			};
			const updateTransformationStepRunResult = await tryAsync({
				try: () =>
					db.transformationRuns
						.where('id')
						.equals(transformationRun.id)
						.modify(markTransformationRunAndRunStepAsFailed),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error updating transformation step run status in Dexie',
						error,
					}),
			});
			if (!updateTransformationStepRunResult.ok)
				return updateTransformationStepRunResult;

			markTransformationRunAndRunStepAsFailed(transformationRun);
			return Ok(transformationRun);
		},

		async markTransformationRunStepAsCompleted({
			transformationRun,
			stepRunId,
			output,
		}) {
			const markTransformationRunStepAsCompleted = (
				transformationRun: TransformationRun,
			) => {
				const stepRun = transformationRun.stepRuns.find(
					(sr) => sr.id === stepRunId,
				);
				if (!stepRun) return;
				const now = new Date().toISOString();
				stepRun.status = 'completed';
				stepRun.completedAt = now;
				stepRun.output = output;
			};

			const updateTransformationStepRunResult = await tryAsync({
				try: () =>
					db.transformationRuns
						.where('id')
						.equals(transformationRun.id)
						.modify(markTransformationRunStepAsCompleted),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error updating transformation step run status in Dexie',
						error,
					}),
			});
			if (!updateTransformationStepRunResult.ok)
				return updateTransformationStepRunResult;

			markTransformationRunStepAsCompleted(transformationRun);
			return Ok(transformationRun);
		},

		async markTransformationRunAsCompleted({ transformationRun, output }) {
			const markTransformationRunAsCompleted = (
				transformationRun: TransformationRun,
			) => {
				const now = new Date().toISOString();
				transformationRun.status = 'completed';
				transformationRun.completedAt = now;
				transformationRun.output = output;
			};
			const updateTransformationStepRunResult = await tryAsync({
				try: () =>
					db.transformationRuns
						.where('id')
						.equals(transformationRun.id)
						.modify(markTransformationRunAsCompleted),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error updating transformation step run status in Dexie',
						error,
					}),
			});
			if (!updateTransformationStepRunResult.ok)
				return updateTransformationStepRunResult;

			markTransformationRunAsCompleted(transformationRun);
			return Ok(transformationRun);
		},
	} satisfies DbTransformationsService;
}
