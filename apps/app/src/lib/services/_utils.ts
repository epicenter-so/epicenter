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
