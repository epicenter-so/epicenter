import { createTaggedError } from 'wellcrafted/error';
import type { Result } from 'wellcrafted/result';

const { DownloadServiceError, DownloadServiceErr } = createTaggedError(
	'DownloadServiceError',
);
type DownloadServiceError = ReturnType<typeof DownloadServiceError>;
export { DownloadServiceError, DownloadServiceErr };

export type DownloadService = {
	downloadBlob: (args: {
		name: string;
		blob: Blob;
	}) => Promise<Result<void, DownloadServiceError>>;
};
