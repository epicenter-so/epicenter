import type { Result, TaggedError } from '@epicenterhq/result';

export type DownloadServiceError = TaggedError<'DownloadServiceError'>;

export type DownloadService = {
	downloadBlob: (args: {
		name: string;
		blob: Blob;
	}) => Promise<Result<void, DownloadServiceError>>;
};
