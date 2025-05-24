import { getExtensionFromAudioBlob } from '$lib/utils';
import { Err, Ok } from '@epicenterhq/result';
import { z } from 'zod';
import type { HttpService } from '../http/HttpService';
import {
	HttpServiceErrIntoTranscriptionServiceErr,
	type TranscriptionService,
	type TranscriptionServiceError,
} from './TranscriptionService';

const whisperApiResponseSchema = z.union([
	z.object({ text: z.string() }),
	z.object({ error: z.object({ message: z.string() }) }),
]);

const MAX_FILE_SIZE_MB = 25 as const;

export function createWhisperService({
	HttpService,
	modelName,
	postConfig,
	preValidate,
	errorConfig,
}: {
	HttpService: HttpService;
	modelName: string;
	postConfig: { url: string; headers?: Record<string, string> };
	preValidate: () => Promise<Ok<undefined> | Err<TranscriptionServiceError>>;
	errorConfig: { title: string; description: string };
}): TranscriptionService {
	return {
		transcribe: async (audioBlob, options) => {
			const { error: validationError } = await preValidate();
			if (validationError) {
				return Err(validationError);
			}

			const blobSizeInMb = audioBlob.size / (1024 * 1024);
			if (blobSizeInMb > MAX_FILE_SIZE_MB) {
				return Err({
					_tag: 'WhisperingError',
					variant: 'error',
					title: `The file size (${blobSizeInMb}MB) is too large`,
					description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
				});
			}

			const formData = new FormData();
			formData.append(
				'file',
				new File(
					[audioBlob],
					`recording.${getExtensionFromAudioBlob(audioBlob)}`,
					{ type: audioBlob.type },
				),
			);
			formData.append('model', modelName);
			if (options.outputLanguage !== 'auto') {
				formData.append('language', options.outputLanguage);
			}
			if (options.prompt) formData.append('prompt', options.prompt);
			if (options.temperature)
				formData.append('temperature', options.temperature);

			const { data: whisperApiResponse, error: postError } =
				await HttpService.post({
					url: postConfig.url,
					body: formData,
					headers: postConfig.headers,
					schema: whisperApiResponseSchema,
				});

			if (postError) {
				return HttpServiceErrIntoTranscriptionServiceErr(postError);
			}

			if ('error' in whisperApiResponse) {
				return Err({
					_tag: 'WhisperingError',
					variant: 'error',
					title: errorConfig.title,
					description: errorConfig.description,
					action: {
						type: 'more-details',
						error: whisperApiResponse.error.message,
					},
				});
			}

			return Ok(whisperApiResponse.text.trim());
		},
	};
}
