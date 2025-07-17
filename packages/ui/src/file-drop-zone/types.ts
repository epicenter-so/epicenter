/*
	Installed from @ieedan/shadcn-svelte-extras
*/

import type { WithChildren } from 'bits-ui';
import type { HTMLInputAttributes } from 'svelte/elements';

export type FileDropZoneProps = FileDropZonePropsWithoutHTML &
	Omit<HTMLInputAttributes, 'files' | 'multiple'>;

export type FileDropZonePropsWithoutHTML = WithChildren<{
	// just for extra documentation
	/** Takes a comma separated list of one or more file types.
	 *
	 *  [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept)
	 *
	 * ### Usage
	 * ```svelte
	 * <FileDropZone
	 * 		accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	 * />
	 * ```
	 *
	 * ### Common Values
	 * ```svelte
	 * <FileDropZone accept="audio/*"/>
	 * <FileDropZone accept="image/*"/>
	 * <FileDropZone accept="video/*"/>
	 * ```
	 */
	accept?: string;
	fileCount?: number;
	/** The maximum amount files allowed to be uploaded */
	maxFiles?: number;
	/** The maximum size of a file in bytes */
	maxFileSize?: number;
	/** Called when a file does not meet the upload criteria (size, or type) */
	onFileRejected?: (opts: { file: File; reason: FileRejectedReason }) => void;
	/** Called with the uploaded files when the user drops or clicks and selects their files.
	 *
	 * @param files
	 */
	onUpload: (files: File[]) => Promise<void>;

	ref?: HTMLInputElement | null;
}>;

export type FileRejectedReason =
	| 'File type not allowed'
	| 'Maximum file size exceeded'
	| 'Maximum files uploaded';
