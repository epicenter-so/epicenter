export function getExtensionFromAudioBlob(blob: Blob) {
	const mimeIncludes = (...types: string[]) =>
		types.some((type) => blob.type.toLowerCase().includes(type));
	if (mimeIncludes('webm')) return 'webm';
	if (mimeIncludes('mp4', 'mpeg', 'mp4a')) return 'mp4';
	if (mimeIncludes('ogg', 'opus')) return 'ogg';
	if (mimeIncludes('wav', 'wave')) return 'wav';
	// Browser MediaRecorder often produces AAC in MP4 container but labels it as "audio/aac"
	// OpenAI expects .m4a extension for AAC audio (M4A = AAC in MP4 container)
	if (mimeIncludes('aac')) return 'm4a';
	if (mimeIncludes('flac')) return 'flac';
	return 'mp3';
}
