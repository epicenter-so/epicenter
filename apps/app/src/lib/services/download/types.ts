import { createTaggedError } from 'wellcrafted/error';
import type { Result } from 'wellcrafted/result';

const { DownloadServiceError, DownloadServiceErr } = createTaggedError(
	'DownloadServiceError',
);
export type DownloadServiceError = ReturnType<typeof DownloadServiceError>;
export { type DownloadServiceError, DownloadServiceErr };

export type DownloadService = {
	downloadBlob: (args: {
		name: string;
		blob: Blob;
	}) => Promise<Result<void, DownloadServiceError>>;
};
