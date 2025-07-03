import type { Result } from 'wellcrafted/result';
import type { TaggedError } from 'wellcrafted/error';

export type DownloadServiceError = TaggedError<'DownloadServiceError'>;

export type DownloadService = {
	downloadBlob: (args: {
		name: string;
		blob: Blob;
	}) => Promise<Result<void, DownloadServiceError>>;
};
