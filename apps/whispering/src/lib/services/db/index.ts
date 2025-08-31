import { DownloadServiceLive } from '$lib/services/download';
import { createDbServiceDexie } from '$lib/services/db/dexie';

export { createDbServiceDexie, DbServiceErr } from '$lib/services/db/dexie';
export {
	generateDefaultTransformation,
	generateDefaultTransformationStep,
	TRANSFORMATION_STEP_TYPES,
	TRANSFORMATION_STEP_TYPES_TO_LABELS,
} from '$lib/services/db/models';
export type {
	InsertTransformationStep,
	Recording,
	Transformation,
	TransformationRun,
	TransformationRunCompleted,
	TransformationRunFailed,
	TransformationStep,
	TransformationStepRun,
} from '$lib/services/db/models';

export const DbServiceLive = createDbServiceDexie({
	DownloadService: DownloadServiceLive,
});
