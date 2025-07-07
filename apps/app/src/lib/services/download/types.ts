import type { Result } from 'wellcrafted/result';
import { createTaggedError } from 'wellcrafted/error';

const { DownloadServiceError, DownloadServiceErr } = createTaggedError(
	'DownloadServiceError',
);
export type DownloadServiceError = ReturnType<typeof DownloadServiceError>;
export { DownloadServiceError, DownloadServiceErr };

export type DownloadService = {
	downloadBlob: (args: {
		name: string;
		blob: Blob;
	}) => Promise<Result<void, DownloadServiceError>>;
};
