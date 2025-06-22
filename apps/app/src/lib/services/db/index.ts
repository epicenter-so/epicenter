import { DownloadServiceLive } from '../download';
import { createDbServiceDexie } from './dexie';

export { createDbServiceDexie } from './dexie';
export {
	generateDefaultTransformation,
	generateDefaultTransformationStep,
	TRANSFORMATION_STEP_TYPES,
	TRANSFORMATION_STEP_TYPES_TO_LABELS,
} from './models';
export type {
	DbServiceError,
	InsertTransformationStep,
	Recording,
	Transformation,
	TransformationRun,
	TransformationRunCompleted,
	TransformationRunFailed,
	TransformationStep,
	TransformationStepRun,
} from './models';
export type { DbService } from './types';

export const DbServiceLive = createDbServiceDexie({
	DownloadService: DownloadServiceLive,
});
