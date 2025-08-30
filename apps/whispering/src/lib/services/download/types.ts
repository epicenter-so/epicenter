import type { Result } from 'wellcrafted/result';

import { createTaggedError } from 'wellcrafted/error';

export const { DownloadServiceErr, DownloadServiceError } = createTaggedError(
	'DownloadServiceError',
);
export type DownloadService = {
	downloadBlob: (args: {
		blob: Blob;
		name: string;
	}) => Promise<Result<void, DownloadServiceError>>;
};

type DownloadServiceError = ReturnType<typeof DownloadServiceError>;
