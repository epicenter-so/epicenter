import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any }
	? Omit<T, 'children'>
	: T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
	ref?: U | null;
};

export function getExtensionFromAudioBlob(blob: Blob) {
	const mimeIncludes = (...types: string[]) =>
		types.some((type) => blob.type.toLowerCase().includes(type));
	if (mimeIncludes('webm')) return 'webm';
	if (mimeIncludes('mp4', 'mpeg', 'mp4a')) return 'mp4';
	if (mimeIncludes('ogg', 'opus')) return 'ogg';
	if (mimeIncludes('wav', 'wave')) return 'wav';
	if (mimeIncludes('aac')) return 'aac';
	if (mimeIncludes('flac')) return 'flac';
	return 'mp3';
}
